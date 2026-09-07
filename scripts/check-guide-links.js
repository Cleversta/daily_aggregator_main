// scripts/check-guide-links.js
//
// Run weekly. Checks every published recommendation's URL and flags dead
// ones as is_stale, so GuideDetailPage stops showing them without you
// having to notice manually.
//
// No AI, no Tavily/Gemini calls — plain HTTP check, effectively free.
// Nothing gets deleted or auto-replaced; a stale row just stops rendering
// on the live page until you fix or remove it in Supabase.

require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');

const TIMEOUT_MS = 10000;

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (!res.ok) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const supabase = getSupabaseAdmin();

  const { data: recs, error } = await supabase
    .from('guide_recommendations')
    .select('id, name, url, is_stale')
    .eq('status', 'published');

  if (error) {
    console.error('Failed to load guide_recommendations:', error.message);
    process.exit(1);
  }

  let checked = 0, newlyStale = 0, recovered = 0;

  for (const rec of recs || []) {
    const alive = await checkUrl(rec.url);
    checked += 1;

    if (!alive && !rec.is_stale) {
      newlyStale += 1;
      await supabase.from('guide_recommendations')
        .update({ is_stale: true, updated_at: new Date().toISOString() })
        .eq('id', rec.id);
      console.log(`STALE: ${rec.name} (${rec.url})`);
    } else if (alive && rec.is_stale) {
      recovered += 1;
      await supabase.from('guide_recommendations')
        .update({ is_stale: false, last_verified: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', rec.id);
      console.log(`RECOVERED: ${rec.name} (${rec.url})`);
    } else if (alive) {
      await supabase.from('guide_recommendations')
        .update({ last_verified: new Date().toISOString() })
        .eq('id', rec.id);
    }
  }

  console.log(`Checked ${checked} links — ${newlyStale} newly stale, ${recovered} recovered.`);
}

main();