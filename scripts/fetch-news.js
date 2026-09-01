// scripts/fetch-news.js
//
// Runs once a day (triggered by .github/workflows/daily-fetch.yml).
// For each category: search Tavily -> summarize with Gemini -> upsert into Supabase.
//
// PROTOTYPE SCOPE: intentionally limited to 3 categories (one per rough CPM tier)
// so you can validate the whole pipeline — including AdSense review — before
// scaling to the full 33-category list. Add categories to CATEGORIES below only
// after this runs cleanly for a week.

require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');

const CATEGORIES = ['ai', 'crypto', 'football'];

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

async function searchTavily(category) {
  const response = await fetchWithTimeout(
    TAVILY_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `latest news about ${category.replace('-', ' ')} today`,
        topic: 'news',
        search_depth: 'basic',
        max_results: 5,
        include_images: true,
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`Tavily API responded with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Tavily returned zero results');
  }

  return data;
}

async function synthesizeWithGemini(category, tavilyData) {
  const sourceList = tavilyData.results
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n${r.content}`)
    .join('\n\n');

  const prompt = `You are a news editor. Based ONLY on the source excerpts below about "${category}",
write a factual, original 200-word (max) summary in your own words for a general reader.
Do not copy sentences verbatim from the sources. Cross-reference the sources for consistency
and skip anything that only one source reports and seems unverified.

Then write:
- An SEO title (max 60 characters)
- An SEO meta description (max 155 characters)

Respond ONLY as JSON, no markdown fences, in this exact shape:
{"summary": "...", "seo_title": "...", "seo_description": "..."}

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

  if (!parsed.summary || !parsed.seo_title || !parsed.seo_description) {
    throw new Error('Gemini JSON is missing required fields');
  }

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
        image_url: payload.image_url || null,
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
    // (e.g. Tavily or Gemini is down), rather than burning quota on 33 guaranteed failures.
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `🛑 ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Aborting run to protect quota.`
      );
      break;
    }

    console.log(`⏳ Processing [${category}]...`);

    try {
      const tavilyData = await searchTavily(category);
      const synthesis = await synthesizeWithGemini(category, tavilyData);

      await upsertArticle(supabase, category, {
        ...synthesis,
        image_url: tavilyData.results.find((r) => r.images?.length)?.images?.[0] || null,
        sources: tavilyData.results.map((r) => ({ name: r.title, url: r.url })),
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
