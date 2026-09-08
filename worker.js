// worker.js
//
// Single entry point required by Cloudflare Workers Builds (this project
// deploys as a Worker, not classic Pages — the old /functions/*.js files
// relied on Pages' automatic file-based routing, which doesn't apply here).
// This replaces functions/subscribe.js, functions/confirm.js, and
// functions/admin-add-guide.js with one script that routes by path, then
// falls through to serving the static site for everything else.

import { createClient } from '@supabase/supabase-js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function sendConfirmEmail(env, email, token) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://dailyaggregator.online';
  const confirmUrl = `${siteUrl}/confirm?token=${token}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.DIGEST_FROM_EMAIL || 'Daily Aggregator <digest@dailyaggregator.online>',
      to: email,
      subject: 'Confirm your Daily Aggregator subscription',
      html: `<p>One click and you're on the list.</p><p><a href="${confirmUrl}">Confirm your email</a></p><p>Didn't request this? Ignore this email and nothing happens.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend confirm email failed (${response.status}): ${body}`);
  }
}

async function handleSubscribe(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      { email, categories, token: crypto.randomUUID(), confirmed_at: null, unsubscribed_at: null },
      { onConflict: 'email' }
    )
    .select('token')
    .single();

  if (error) {
    console.error('subscribe: upsert failed:', error.message);
    return json({ error: 'Something went wrong. Try again shortly.' }, 500);
  }

  try {
    await sendConfirmEmail(env, email, data.token);
  } catch (err) {
    console.error('subscribe: confirm email failed:', err.message);
    return json({ error: 'Signed up, but the confirm email failed to send.' }, 500);
  }

  return json({ ok: true, message: 'Check your inbox to confirm.' });
}

async function handleConfirm(request, env) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://dailyaggregator.online';
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) return Response.redirect(`${siteUrl}/?subscribed=invalid`, 302);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('subscribers')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('token', token)
    .is('unsubscribed_at', null)
    .select('email')
    .single();

  if (error || !data) return Response.redirect(`${siteUrl}/?subscribed=invalid`, 302);
  return Response.redirect(`${siteUrl}/?subscribed=confirmed`, 302);
}

async function handleAdminAddGuide(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!env.ADMIN_SECRET || payload.secret !== env.ADMIN_SECRET) {
    return json({ error: 'Wrong password.' }, 401);
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
    .filter((r) => r.name && r.url);

  if (!name || !category) return json({ error: 'Task name and category are required.' }, 400);
  if (recommendations.length === 0) return json({ error: 'Add at least one tool with a name and URL.' }, 400);

  const slug = slugify(name);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: intent, error: intentError } = await supabase
    .from('guide_intents')
    .upsert({ slug, name, category, description, status: 'published' }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (intentError) return json({ error: `Couldn't save the intent: ${intentError.message}` }, 500);

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
  if (recError) return json({ error: `Couldn't save recommendations: ${recError.message}` }, 500);

  if (phrases.length > 0) {
    await supabase.from('guide_search_phrases').insert(phrases.map((phrase) => ({ intent_id: intent.id, phrase })));
  }

  return json({ ok: true, slug, savedCount: rows.length });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      return handleSubscribe(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/confirm') {
      return handleConfirm(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/admin-add-guide') {
      return handleAdminAddGuide(request, env);
    }

    // Not a known API route — serve the static Next.js export.
    return env.ASSETS.fetch(request);
  },
};