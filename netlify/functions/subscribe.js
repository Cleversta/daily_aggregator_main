// netlify/functions/subscribe.js
//
// POST { email, categories? } -> inserts (or refreshes) an unconfirmed
// subscriber row and emails a confirm link. No login, no session — the
// confirm/unsubscribe links themselves carry a one-time token as their auth.
//
// Reachable at /.netlify/functions/subscribe once deployed.

const { createClient } = require('@supabase/supabase-js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gator.online';

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function sendConfirmEmail(email, token) {
  const confirmUrl = `${SITE_URL}/.netlify/functions/confirm?token=${token}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.DIGEST_FROM_EMAIL || 'Daily Aggregator <digest@example.com>',
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];

  if (!EMAIL_RE.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Enter a valid email address.' }) };
  }

  const supabase = getSupabaseAdmin();

  // Upsert so re-submitting the form (e.g. to change categories, or to
  // resend a lost confirm email) doesn't error on the unique email index.
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
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Try again shortly.' }) };
  }

  try {
    await sendConfirmEmail(email, data.token);
  } catch (err) {
    console.error('subscribe: confirm email failed:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Signed up, but the confirm email failed to send.' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, message: 'Check your inbox to confirm.' }),
  };
};