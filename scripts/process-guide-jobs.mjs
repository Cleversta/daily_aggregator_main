import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { processOne } from '../lib/guide-ai.mjs';
dotenv.config({ path: '.env.local' });
const env = process.env;
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase worker configuration.');
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
// Optional maintenance: one older published draft enters review per UTC day.
// Never replace a draft awaiting human review or start all 15 at once.
if (env.GUIDE_AUTO_REVIEW === 'true') {
  const { data: due, error } = await db.from('guide_drafts').select('slug,version')
    .eq('status', 'published').lt('updated_at', new Date(Date.now()-14*86400000).toISOString())
    .order('updated_at').limit(1);
  if (error) throw new Error(error.message);
  if (due?.length) {
    const { data: allowed, error: reserveError } = await db.rpc('guide_reserve', {
      p_provider: 'rotation', p_period: new Date().toISOString().slice(0,10), p_limit: 1,
    });
    if (reserveError) throw new Error(reserveError.message);
    if (allowed) {
      const { error: queueError } = await db.rpc('guide_queue', { p_slug: due[0].slug, p_version: due[0].version });
      if (queueError) throw new Error(queueError.message);
    }
  }
}
// Two jobs per invocation; provider counters persist in the database across runs.
for (let i = 0; i < 2; i++) {
  if (!await processOne(db, env)) break;
}
console.log('Guide queue pass complete. See job status in the admin.');
