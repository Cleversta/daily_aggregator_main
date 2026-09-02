// scripts/fetch-news.js
//
// Runs once a day (triggered by .github/workflows/daily-fetch.yml).
// For each category: research current reporting with Tavily -> summarize with Gemini -> upsert into Supabase.
//
// PROTOTYPE SCOPE: intentionally limited to 3 categories (one per rough CPM tier)
// so you can validate the whole pipeline — including AdSense review — before
// scaling to the full 33-category list. Add categories to CATEGORIES below only
// after this runs cleanly for a week.

require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');

const CATEGORIES = ['ai', 'crypto', 'football'];

const TAVILY_QUERY_BY_CATEGORY = {
  ai: 'artificial intelligence latest news',
  crypto: 'cryptocurrency bitcoin latest news',
  football: 'football soccer latest news',
};

const TAVILY_URL = 'https://api.tavily.com/search';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const DELAY_BETWEEN_CATEGORIES_MS = 1500;
const MAX_CONSECUTIVE_FAILURES = 5; // real circuit breaker: aborts the whole run
const REQUEST_TIMEOUT_MS = 20000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// fetch() with a timeout, since a hung request would otherwise stall the whole run.
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function getSourceName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

async function getRecentTavilyResults(category) {
  if (!process.env.TAVILY_API_KEY) throw new Error('Missing TAVILY_API_KEY');

  const response = await fetchWithTimeout(
    TAVILY_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: TAVILY_QUERY_BY_CATEGORY[category] || `${category} latest news`,
        topic: 'news',
        time_range: 'day',
        search_depth: 'basic',
        max_results: 5,
        include_raw_content: false,
        include_images: false,
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) throw new Error(`Tavily API responded with status ${response.status}`);

  const data = await response.json();
  const results = (data.results || [])
    .filter((item) => item.title && item.url && item.content)
    .map((item) => ({ title: item.title, url: item.url, content: item.content }));

  if (results.length < 2) throw new Error('Tavily returned too few usable sources');
  return { results };
}

async function synthesizeWithGemini(category, sourceData) {
  const sourceList = sourceData.results
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n${r.content}`)
    .join('\n\n');

  const prompt = `You are the editor of a calm, trustworthy daily news briefing. Based ONLY on the
source excerpts below about "${category}", select the most important current development and write
a clear, original brief for a general reader.

Editorial standards:
- Write 110–180 words in two short paragraphs. Lead with what happened, then explain why it matters.
- Be concrete: name the people, companies, places, numbers, or events that the sources support.
- Use direct, natural language. Avoid generic openings, hype, clickbait, predictions, and phrases such
  as "in a rapidly changing landscape" or "the sources say."
- Do not copy sentences verbatim. Cross-reference sources for consistency; omit claims that appear
  unverified or are supported by only one weak source.
- If the reporting is thin or conflicting, be precise about the uncertainty rather than filling gaps.

Then write:
- A specific, informative SEO title (max 60 characters; no clickbait)
- An SEO meta description (max 155 characters)
- Three distinct, useful creator packages based on this development. Each must include a short title,
  a platform (TikTok, YouTube Shorts, or Instagram Reel), a hook for the first three seconds, a
  three-step script outline, a short caption, and thumbnail text (max 5 words). Also include a
  copy-ready prompt that brings everything together. Use only 2–3 factual points supported by the
  sources. Do not claim something will go viral.

Respond ONLY as JSON, no markdown fences, in this exact shape:
{"summary": "...", "seo_title": "...", "seo_description": "...", "creator_ideas": [{"title": "...", "platform": "...", "hook": "...", "outline": ["...", "...", "..."], "caption": "...", "thumbnail_text": "...", "prompt": "..."}]}

SOURCES:
${sourceList}`;

  const response = await fetchWithTimeout(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`Gemini API responded with status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned no usable text');
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  if (!parsed.summary || !parsed.seo_title || !parsed.seo_description || !Array.isArray(parsed.creator_ideas)) {
    throw new Error('Gemini JSON is missing required fields');
  }

  const wordCount = parsed.summary.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 60 || wordCount > 220) {
    throw new Error(`Gemini summary has an invalid length (${wordCount} words)`);
  }

  parsed.creator_ideas = parsed.creator_ideas
    .filter((idea) =>
      idea?.title &&
      idea?.platform &&
      idea?.hook &&
      Array.isArray(idea?.outline) &&
      idea.outline.length === 3 &&
      idea?.caption &&
      idea?.thumbnail_text &&
      idea?.prompt
    )
    .slice(0, 3);
  if (parsed.creator_ideas.length < 3) throw new Error('Gemini returned too few creator ideas');

  return parsed;
}

async function upsertArticle(supabase, category, payload) {
  const { error } = await supabase
    .from('articles')
    .upsert(
      {
        category,
        headline: payload.seo_title,
        summary: payload.summary,
        seo_title: payload.seo_title,
        seo_description: payload.seo_description,
        // Category visuals are used in the UI rather than republishing publisher media.
        image_url: null,
        video_url: null,
        video_thumbnail_url: null,
        creator_ideas: payload.creator_ideas,
        sources: payload.sources,
        is_stale: false,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'category' }
    );

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }
}

async function markStale(supabase, category) {
  // Leave yesterday's row in place but flag it, so the frontend can show
  // "last updated" honestly instead of silently serving old content as new.
  const { error } = await supabase
    .from('articles')
    .update({ is_stale: true })
    .eq('category', category);

  if (error) {
    console.error(`Could not mark [${category}] as stale:`, error.message);
  }
}

async function runDailyUpdate() {
  const supabase = getSupabaseAdmin();
  let consecutiveFailures = 0;
  let succeeded = 0;
  let failed = 0;

  for (const category of CATEGORIES) {
    // Real circuit breaker: abort the whole run if failures are stacking up
    // (e.g. Gemini or the database is down), rather than burning quota on failures.
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `🛑 ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Aborting run to protect quota.`
      );
      break;
    }

    console.log(`⏳ Processing [${category}]...`);

    try {
      const sourceData = await getRecentTavilyResults(category);
      const synthesis = await synthesizeWithGemini(category, sourceData);

      await upsertArticle(supabase, category, {
        ...synthesis,
        sources: sourceData.results.map((r) => ({ name: getSourceName(r.url), url: r.url })),
      });

      console.log(`✅ [${category}] updated.`);
      succeeded++;
      consecutiveFailures = 0; // reset streak on success
    } catch (error) {
      console.error(`❌ [${category}] failed: ${error.message}. Keeping stale content live.`);
      await markStale(supabase, category);
      failed++;
      consecutiveFailures++;
    }

    await sleep(DELAY_BETWEEN_CATEGORIES_MS); // avoid hammering rate limits
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed/stale.`);

  if (succeeded === 0) {
    // Nothing updated at all — fail the CI job so you get notified, instead
    // of silently deploying a site with zero fresh content.
    process.exit(1);
  }
}

runDailyUpdate();
