import { createClient } from '@supabase/supabase-js';
import { normalizeGuide, starters } from '../lib/guide-workflow.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

export async function onRequestPost({ request, env }) {
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ error: 'Invalid JSON body.' }, 400);
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !anonKey) {
    return json({ error: 'Configure Supabase URL, anon key, and service key for this Cloudflare environment.' }, 503);
  }

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json({ error: 'Sign in with your admin email first.' }, 401);

  const auth = createClient(env.SUPABASE_URL, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user?.email) return json({ error: 'Your sign-in expired. Sign in again.' }, 401);

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: admin, error: adminError } = await db
    .from('guide_admins')
    .select('email')
    .eq('email', userData.user.email.toLowerCase())
    .maybeSingle();
  if (adminError) return json({ error: 'Guide admin authorization is not configured in Supabase.' }, 503);
  if (!admin) return json({ error: 'This email is not authorized for Guide administration.' }, 403);

  try {
    switch (payload.action) {
      case 'list': {
        const drafts = unwrap(await db.from('guide_drafts').select('*').order('updated_at', { ascending: false }));
        const jobs = unwrap(await db.from('guide_jobs').select('id,slug,status,attempts,message,available_at,created_at').order('created_at', { ascending: false }).limit(100));
        const usage = unwrap(await db.from('guide_usage').select('*').order('period', { ascending: false }).limit(40));
        const flags = unwrap(await db.from('guide_recommendations').select('name,url,needs_review,is_stale,guide_intents(slug)').or('needs_review.eq.true,is_stale.eq.true').limit(100));
        return json({ drafts, jobs, usage, flags });
      }
      case 'seed': {
        const rows = starters.map(s => ({ slug: s.slug, content: normalizeGuide(s) }));
        unwrap(await db.from('guide_drafts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true }));
        return json({ message: '15 starter tasks prepared. Existing drafts were preserved. Research each task when ready.' });
      }
      case 'save': {
        const content = normalizeGuide(payload.content);
        if (!Number.isInteger(payload.version) || payload.version < 0) return json({ error: 'Invalid draft version.' }, 400);
        const draft = unwrap(await db.rpc('guide_save', { p_slug: content.slug, p_content: content, p_version: payload.version }));
        return json({ draft, message: 'Draft saved. Published content is unchanged.' });
      }
      case 'research': {
        const id = unwrap(await db.rpc('guide_queue', { p_slug: payload.slug, p_version: payload.version }));
        return json({ id, message: 'Research queued. The scheduled worker will process it; refresh to see progress.' });
      }
      case 'publish': {
        if (payload.reviewed !== true) return json({ error: 'Confirm that you reviewed the instructions and evidence.' }, 400);
        const draft = unwrap(await db.from('guide_drafts').select('*').eq('slug', payload.slug).single());
        normalizeGuide(draft.content, true);
        const publicationId = unwrap(await db.rpc('guide_publish', { p_slug: payload.slug, p_version: payload.version }));
        const deployment = await rebuild(env);
        return json({ publicationId, ...deployment });
      }
      case 'rebuild': return json(await rebuild(env));
      default: return json({ error: 'Unknown action. Refresh the admin page after deploying the new version.' }, 400);
    }
  } catch (error) {
    // Database messages contain no keys; provider response bodies are never returned.
    return json({ error: error.message }, /Draft changed|duplicate key/.test(error.message) ? 409 : 400);
  }
}

async function rebuild(env) {
  if (!env.CLOUDFLARE_DEPLOY_HOOK_URL) return { deployment: 'not_requested', message: 'Saved for publication. Configure CLOUDFLARE_DEPLOY_HOOK_URL or rebuild Cloudflare manually.' };
  try {
    const response = await fetch(env.CLOUDFLARE_DEPLOY_HOOK_URL, { method: 'POST', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Deploy hook failed');
    return { deployment: 'requested', message: 'Rebuild requested. Use “Check live publication” after Cloudflare finishes; the request alone does not mean the page is live.' };
  } catch {
    return { deployment: 'failed', message: 'Content saved, but the rebuild request failed. Use Retry rebuild or redeploy in Cloudflare.' };
  }
}
