// scripts/generate-guide-index.js
//
// Runs before `next build`. Reads all published guide_intents + their
// search phrases from Supabase and writes a flat JSON file to
// public/guide-index.json.
//
// This is the ONLY thing GuideSearch.js fetches at runtime — a static file,
// not an API. Even with a few hundred intents this stays well under 100KB.

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { getSupabaseAdmin } = require('../lib/supabase-admin');

async function main() {
  const supabase = getSupabaseAdmin();

  const { data: intents, error: intentsError } = await supabase
    .from('guide_intents')
    .select('id, slug, name')
    .eq('status', 'published');

  if (intentsError) {
    console.error('Failed to load guide_intents:', intentsError.message);
    process.exit(1);
  }

  const { data: phrases, error: phrasesError } = await supabase
    .from('guide_search_phrases')
    .select('intent_id, phrase');

  if (phrasesError) {
    console.error('Failed to load guide_search_phrases:', phrasesError.message);
    process.exit(1);
  }

  const phrasesByIntent = {};
  for (const row of phrases || []) {
    (phrasesByIntent[row.intent_id] ||= []).push(row.phrase);
  }

  const index = (intents || []).map((intent) => ({
    slug: intent.slug,
    name: intent.name,
    phrases: phrasesByIntent[intent.id] || [],
  }));

  const outPath = path.join(__dirname, '..', 'public', 'guide-index.json');
  fs.writeFileSync(outPath, JSON.stringify(index));
  console.log(`Wrote ${index.length} intents to ${outPath}`);
}

main();