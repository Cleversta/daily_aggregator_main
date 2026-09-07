// functions/admin-add-guide.js
//
// Cloudflare Pages Function, reachable at POST /admin-add-guide.
// Lets you add a guide intent + one or more recommendations from the
// /admin/guide form (works from a phone browser) instead of the Supabase
// table editor.
//
// Protected by a shared secret (ADMIN_SECRET) — not a real login system,
// just enough to keep this off Google and out of random hands. Don't link
// /admin/guide anywhere public.

import { createClient } from '@supabase/supabase-js';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.ADMIN_SECRET || payload.secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Wrong password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name = String(payload.name || '').trim();
  const category = String(payload.category || '').trim();
  const description = String(payload.description || '').trim();
  const phrases = String(payload.phrases || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const recommendations = (Array.isArray(payload.recommendations) ? payload.recommendations : [])
    .map((r) => ({
      name: String(r.name || '').trim(),
      url: String(r.url || '').trim(),
      description: String(r.description || '').trim(),
      reason: String(r.reason || '').trim(),
    }))
    .filter((r) => r.name && r.url); // drop empty rows the user left blank

  if (!name || !category) {
    return new Response(JSON.stringify({ error: 'Task name and category are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (recommendations.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Add at least one tool with a name and URL.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const slug = slugify(name);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Upsert the intent — submitting the same task name again later reuses
  // the existing row instead of creating a duplicate page.
  const { data: intent, error: intentError } = await supabase
    .from('guide_intents')
    .upsert(
      { slug, name, category, description, status: 'published' },
      { onConflict: 'slug' }
    )
    .select('id')
    .single();

  if (intentError) {
    return new Response(JSON.stringify({ error: `Couldn't save the intent: ${intentError.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // New recommendations rank after any that already exist for this intent.
  const { count } = await supabase
    .from('guide_recommendations')
    .select('id', { count: 'exact', head: true })
    .eq('intent_id', intent.id);

  const startRank = (count || 0) + 1;
  const rows = recommendations.map((rec, i) => ({
    intent_id: intent.id,
    name: rec.name,
    url: rec.url,
    description: rec.description,
    reason: rec.reason,
    rank: startRank + i,
    status: 'published',
  }));

  const { error: recError } = await supabase.from('guide_recommendations').insert(rows);

  if (recError) {
    return new Response(JSON.stringify({ error: `Couldn't save recommendations: ${recError.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (phrases.length > 0) {
    await supabase
      .from('guide_search_phrases')
      .insert(phrases.map((phrase) => ({ intent_id: intent.id, phrase })));
  }

  return new Response(JSON.stringify({ ok: true, slug, savedCount: rows.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}