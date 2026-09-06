// functions/subscribe.js
//
// Cloudflare Pages Function. File-based routing: this file is automatically
// reachable at POST /subscribe (no /.netlify/functions/ prefix needed here —
// Cloudflare Pages Functions live at the path matching their filename under
// /functions, relative to your site's root).
//
// Same logic as the old netlify/functions/subscribe.js: upserts an
// unconfirmed subscriber row and emails a confirm link. No login, no
// session — the confirm/unsubscribe links carry a one-time token as auth.

import { createClient } from '@supabase/supabase-js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Cloudflare Pages Functions export a handler named for the HTTP method.
// `context` gives you { request, env, params, ... } — env replaces
// process.env since this runs on Cloudflare's edge runtime, not Node.
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

  const email = String(payload.email || '').trim().toLowerCase();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];

  if (!EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'Enter a valid email address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      {
        email,
        categories,
        token: crypto.randomUUID(),
        confirmed_at: null,
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    )
    .select('token')
    .single();

  if (error) {
    console.error('subscribe: upsert failed:', error.message);
    return new Response(JSON.stringify({ error: 'Something went wrong. Try again shortly.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await sendConfirmEmail(env, email, data.token);
  } catch (err) {
    console.error('subscribe: confirm email failed:', err.message);
    return new Response(
      JSON.stringify({ error: 'Signed up, but the confirm email failed to send.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ ok: true, message: 'Check your inbox to confirm.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}