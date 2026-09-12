// worker.js
//
// Single entry point required by Cloudflare Workers Builds (this project
// deploys as a Worker, not classic Pages — the old /functions/*.js files
// relied on Pages' automatic file-based routing, which doesn't apply here).
// This replaces functions/subscribe.js, functions/confirm.js, and
// functions/admin-add-guide.js with one script that routes by path, then
// falls through to serving the static site for everything else.

import { createClient } from '@supabase/supabase-js';
import { onRequestPost as handleGuideAdmin } from './functions/admin-add-guide.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CANONICAL_HOST = 'dailyaggregator.online';
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function secure(response) {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  return secured;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if ((url.protocol !== 'https:' || url.hostname === `www.${CANONICAL_HOST}`) &&
        !['localhost', '127.0.0.1'].includes(url.hostname)) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      return secure(Response.redirect(url.toString(), 308));
    }

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      return secure(await handleSubscribe(request, env));
    }
    if (request.method === 'GET' && url.pathname === '/confirm') {
      return secure(await handleConfirm(request, env));
    }
    if (request.method === 'POST' && url.pathname === '/admin/guide-api') {
      return secure(await handleGuideAdmin({ request, env }));
    }

    // Not a known API route — serve the static Next.js export.
    return secure(await env.ASSETS.fetch(request));
  },
};
