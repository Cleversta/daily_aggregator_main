// scripts/check-guide-links.js
//
// Run weekly. Checks every published recommendation's URL and flags dead
// ones for editorial review. A failed link check is not proof a tool is gone.
//
// No AI, no Tavily/Gemini calls — plain HTTP check, effectively free.
// Nothing gets deleted or auto-replaced. Link checks never advance the
// editorial verification date.

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

  let checked = 0, flagged = 0;
  for (const rec of recs || []) {
    const alive = await checkUrl(rec.url);
    const patch = { link_checked_at: new Date().toISOString() };
    if (!alive) { patch.needs_review = true; flagged++; }
    // A successful request cannot verify pricing, features or recovery of a
    // previously withdrawn recommendation. Only the editor can clear those.
    const { error: updateError } = await supabase.from('guide_recommendations').update(patch).eq('id', rec.id);
    if (updateError) throw new Error(updateError.message);
    checked++;
  }
  console.log(`Checked ${checked} links — ${flagged} flagged for review. Editorial dates unchanged.`);

}

main().catch(error => { console.error(error.message); process.exitCode = 1; });