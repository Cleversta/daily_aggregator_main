// scripts/fetch-topics.js
//
// Runs once a day (add as a step in .github/workflows/daily-fetch.yml, or a
// separate workflow — either works, this is independent from fetch-news.js).
//
// For each topic in TODAY's rotation group (see lib/topics.js — 20 of the
// 100 topics per day, full cycle every 5 days):
//   1. Query Tavily for that topic.
//   2. Diff the returned source URLs against yesterday's stored snapshot
//      for this topic.
//   3. If the URL set is unchanged -> skip Gemini entirely, just update
//      last_checked_at / freshness_note. Saves the Gemini call on a day
//      where nothing new turned up.
//   4. If it changed (or this is the topic's first run) -> call Gemini,
//      write the full content, store a new snapshot.
//
// Mirrors fetch-news.js's safety patterns: request timeouts, a circuit
// breaker that aborts the whole run after too many consecutive failures,
// and a stale-but-live fallback instead of blanking a page on failure.

require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');
const { getAllTopics, getTopicsForRotationGroup, getTodaysRotationGroup } = require('../lib/topics');

const TAVILY_URL = 'https://api.tavily.com/search';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const DELAY_BETWEEN_TOPICS_MS = 2500;
const MAX_CONSECUTIVE_FAILURES = 5;
const TAVILY_TIMEOUT_MS = 20000;
const GEMINI_TIMEOUT_MS = 45000; // Gemini generating a full multi-field JSON body needs more room than a Tavily search
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Wraps a fetch attempt with a couple of retries and backoff — covers
// transient timeouts/rate-limit stalls (common when running --all and
// briefly bumping a free-tier RPM limit) without failing the whole topic
// on what's often just a one-off slow response.
async function withRetries(label, fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt <= MAX_RETRIES) {
        const backoffMs = 3000 * attempt;
        console.log(`   ↻ ${label} attempt ${attempt} failed (${error.message}), retrying in ${backoffMs / 1000}s...`);
        await sleep(backoffMs);
      }
    }
  }
  throw lastError;
}

function getSourceName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

// Topics want a broader, less news-cycle-specific query than the daily
// briefings — "latest news" skews too breaking-news-y for something like
// "Notion" or "Quantum computing" that doesn't have daily headlines.
async function runTavilySearch(topicName, timeRange) {
  if (!process.env.TAVILY_TOPICS_API_KEY) throw new Error('Missing TAVILY_TOPICS_API_KEY');

  const response = await fetchWithTimeout(
    TAVILY_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TAVILY_TOPICS_API_KEY}`,
      },
      body: JSON.stringify({
        query: `${topicName} latest developments`,
        topic: 'general',
        time_range: timeRange,
        search_depth: 'basic',
        max_results: 6,
        include_raw_content: false,
        include_images: false,
      }),
    },
    TAVILY_TIMEOUT_MS
  );

  if (!response.ok) throw new Error(`Tavily API responded with status ${response.status}`);

  const data = await response.json();
  return (data.results || [])
    .filter((item) => item.title && item.url && item.content)
    .map((item) => ({ title: item.title, url: item.url, content: item.content }));
}

async function getTavilyResults(topicName) {
  // 'month' as the default catches broad reference topics (electric vehicles,
  // renewable energy, etc.) that don't always have coverage in the exact
  // last 7 days. If that's still thin, one more attempt with no time limit
  // at all before giving up on this topic for today.
  let results = await withRetries(`Tavily [${topicName}]`, () => runTavilySearch(topicName, 'month'));

  if (results.length < 2) {
    console.log(`   ↻ Only ${results.length} sources in the last month for "${topicName}", widening search...`);
    results = await withRetries(`Tavily [${topicName}] (broadened)`, () => runTavilySearch(topicName, undefined));
  }

  if (results.length < 2) throw new Error('Tavily returned too few usable sources');
  return results;
}

// The cheap, no-Gemini-needed change check: same set of source URLs as last
// time = nothing worth rewriting. Different set = something moved.
function hasChanged(newUrls, previousUrls) {
  if (!previousUrls || previousUrls.length === 0) return true; // first run
  const a = [...newUrls].sort().join('|');
  const b = [...previousUrls].sort().join('|');
  return a !== b;
}

async function getLatestSnapshot(supabase, slug) {
  const { data, error } = await supabase
    .from('topic_snapshots')
    .select('*')
    .eq('topic_slug', slug)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Could not read prior snapshot for [${slug}]:`, error.message);
    return null;
  }
  return data;
}

async function callGemini(prompt) {
  const response = await fetchWithTimeout(
    `${GEMINI_URL}?key=${process.env.GEMINI_TOPICS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json', // forces strict JSON, no stray text/markdown fences
        },
      }),
    },
    GEMINI_TIMEOUT_MS
  );

  if (!response.ok) throw new Error(`Gemini API responded with status ${response.status}`);

  const data = await response.json();

  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') throw new Error('Gemini response was truncated (hit max output tokens)');

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini returned no usable text');

  let parsed;
  try {
    parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  const required = ['snapshot_summary', 'whats_new', 'why_popular', 'key_facts', 'outlook', 'faq', 'change_summary'];
  for (const field of required) {
    if (parsed[field] === undefined) throw new Error(`Gemini JSON missing required field "${field}"`);
  }

  return parsed;
}

async function synthesizeWithGemini(topic, results, hasExistingBackground) {
  if (!process.env.GEMINI_TOPICS_API_KEY) throw new Error('Missing GEMINI_TOPICS_API_KEY');

  const sourceList = results
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n${r.content}`)
    .join('\n\n');

  const backgroundInstruction = hasExistingBackground
    ? 'Do NOT rewrite the background field — omit "background" from your JSON entirely, it already exists.'
    : 'Also write a "background" field: 3-5 sentences on what this is, its origin, and core facts that rarely change. Write it once, plainly, encyclopedia-style.';

  const prompt = `You are writing an evergreen reference page about "${topic}" for a general reader,
based ONLY on the source excerpts below. This is a reference page, not a breaking-news article —
write calmly and factually.

${backgroundInstruction}

Then write:
- "snapshot_summary": 2-3 sentences answering "what is this, right now" (a quick-read summary)
- "whats_new": the most important recent development(s) supported by the sources, 80-150 words
- "why_popular": 2-4 sentences on why this is relevant/searched right now
- "key_facts": an array of 3-6 {"label": "...", "value": "..."} pairs — concrete, checkable facts
  (version numbers, prices, dates, specs — whatever fits this topic)
- "outlook": 2-3 sentences, forward-looking, grounded in the sources, clearly speculative where it is
- "faq": an array of 2-3 {"question": "...", "answer": "..."} pairs a reader would likely ask
- "change_summary": one short sentence describing what's new since the last check (or "First entry"
  if there's nothing to compare against)

Keep every field concise — this must fit comfortably within the response length available. Do not
pad with filler.

Rules:
- Paraphrase everything; never copy sentences verbatim from the sources.
- Do not invent facts, dates, or figures not supported by the sources.
- If sources are thin or conflicting on a point, say so rather than filling the gap.

Respond as JSON only, in this exact shape:
{"background": "...", "snapshot_summary": "...", "whats_new": "...", "why_popular": "...",
"key_facts": [{"label": "...", "value": "..."}], "outlook": "...",
"faq": [{"question": "...", "answer": "..."}], "change_summary": "..."}
(omit "background" entirely if instructed above)

SOURCES:
${sourceList}`;

  return withRetries(`Gemini [${topic}]`, () => callGemini(prompt));
}

async function upsertTopic(supabase, topic, synthesis, sources, isFirstRun) {
  const now = new Date().toISOString();

  const row = {
    slug: topic.slug,
    topic_name: topic.topicName,
    hub_slug: topic.hubSlug,
    topic_category: topic.topicCategory,
    rotation_group: topic.rotationGroup,
    snapshot_summary: synthesis.snapshot_summary,
    whats_new: synthesis.whats_new,
    why_popular: synthesis.why_popular,
    key_facts: synthesis.key_facts,
    outlook: synthesis.outlook,
    faq: synthesis.faq,
    sources,
    change_summary: synthesis.change_summary,
    freshness_note: 'Updated today',
    last_checked_at: now,
    last_updated_at: now,
    is_stale: false,
  };

  if (isFirstRun && synthesis.background) {
    row.background = synthesis.background;
  }

  const { error } = await supabase.from('topics').upsert(row, { onConflict: 'slug' });
  if (error) throw new Error(`Supabase topic upsert failed: ${error.message}`);
}

async function markCheckedNoChange(supabase, slug) {
  const { error } = await supabase
    .from('topics')
    .update({
      last_checked_at: new Date().toISOString(),
      freshness_note: 'Checked, no major changes',
    })
    .eq('slug', slug);

  if (error) console.error(`Could not update last_checked_at for [${slug}]:`, error.message);
}

async function markStale(supabase, slug) {
  const { error } = await supabase.from('topics').update({ is_stale: true }).eq('slug', slug);
  if (error) console.error(`Could not mark [${slug}] as stale:`, error.message);
}

async function storeSnapshot(supabase, slug, sourceUrls, synthesis) {
  const { error } = await supabase.from('topic_snapshots').upsert(
    {
      topic_slug: slug,
      source_urls: sourceUrls,
      snapshot_data: synthesis,
      snapshot_date: new Date().toISOString().slice(0, 10),
    },
    { onConflict: 'topic_slug,snapshot_date' }
  );
  if (error) console.error(`Could not store snapshot for [${slug}]:`, error.message);
}

async function runTopicsUpdate() {
  const supabase = getSupabaseAdmin();
  const runAll = process.argv.includes('--all');

  let topics;
  if (runAll) {
    topics = getAllTopics();
    console.log(`🌐 --all flag set — checking every topic (${topics.length}), ignoring today's rotation group.`);
    console.log(`   This uses up to ${topics.length} Tavily credits + Gemini calls in one run (all "first run" — no diff to skip against).`);
  } else {
    const group = getTodaysRotationGroup();
    topics = getTopicsForRotationGroup(group);
    console.log(`📅 Rotation group ${group}/5 today — checking ${topics.length} topics.`);
  }

  let consecutiveFailures = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const topic of topics) {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`🛑 ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Aborting run to protect quota.`);
      break;
    }

    console.log(`⏳ Checking [${topic.slug}]...`);

    try {
      const results = await getTavilyResults(topic.topicName);
      const newUrls = results.map((r) => r.url);
      const previousSnapshot = await getLatestSnapshot(supabase, topic.slug);
      const changed = hasChanged(newUrls, previousSnapshot?.source_urls);
      const isFirstRun = !previousSnapshot;

      if (!changed) {
        console.log(`➖ [${topic.slug}] no change since last check — skipping Gemini.`);
        await markCheckedNoChange(supabase, topic.slug);
        unchanged++;
      } else {
        const synthesis = await synthesizeWithGemini(topic.topicName, results, !isFirstRun);
        const sources = results.map((r) => ({ name: getSourceName(r.url), url: r.url }));

        await upsertTopic(supabase, topic, synthesis, sources, isFirstRun);
        await storeSnapshot(supabase, topic.slug, newUrls, synthesis);

        console.log(`✅ [${topic.slug}] updated.`);
        updated++;
      }

      consecutiveFailures = 0;
    } catch (error) {
      console.error(`❌ [${topic.slug}] failed: ${error.message}. Keeping stale content live.`);
      await markStale(supabase, topic.slug);
      failed++;
      consecutiveFailures++;
    }

    await sleep(DELAY_BETWEEN_TOPICS_MS);
  }

  console.log(`\nDone. ${updated} updated, ${unchanged} unchanged, ${failed} failed/stale.`);

  if (updated === 0 && unchanged === 0) {
    process.exit(1);
  }
}

runTopicsUpdate();