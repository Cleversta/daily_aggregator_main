// scripts/send-digest.js
//
// Runs once a day (as a step in .github/workflows/daily-fetch.yml, right
// after fetch-news.js finishes its Supabase upsert). Emails every confirmed,
// non-unsubscribed subscriber the day's headlines for their chosen
// categories (or all active categories, if they didn't pick any).
//
// This is a mailing list, not an account system: subscribers have no
// password and never log in. The per-email unsubscribe link's token is the
// only "auth" involved.
//
// NOTE: this script itself runs on GitHub Actions (Node), not on
// Cloudflare/Netlify — only the confirm/unsubscribe *link paths* below
// changed to match Cloudflare Pages Functions routing (no
// /.netlify/functions/ prefix needed there).

require('dotenv').config({ path: '.env.local' });
const { getSupabaseAdmin } = require('../lib/supabase-admin');
const { getActiveCategories } = require('../lib/categories');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dailyaggregator.online';
const RESEND_URL = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 20000;
// Resend's free tier caps at 2 req/sec — stay well under that between sends.
const DELAY_BETWEEN_EMAILS_MS = 600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderDigestHtml(articlesByCategory, activeCategories, unsubscribeUrl) {
  const sections = activeCategories
    .filter((c) => articlesByCategory[c.slug])
    .map((c) => {
      const article = articlesByCategory[c.slug];
      return `
        <tr>
          <td style="padding: 16px 0; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 6px;">${escapeHtml(c.title)}</p>
            <p style="font-size: 16px; font-weight: 700; margin: 0 0 6px; color: #111;">${escapeHtml(article.headline)}</p>
            <p style="font-size: 14px; line-height: 1.5; color: #444; margin: 0 0 10px;">${escapeHtml(article.summary)}</p>
            <a href="${SITE_URL}/category/${c.slug}" style="font-size: 13px; color: #14213B;">Read more →</a>
          </td>
        </tr>`;
    })
    .join('');

  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 0 0 4px;">Daily Aggregator</p>
    <h1 style="font-size: 20px; margin: 0 0 8px; color: #111;">Today's briefing</h1>
    <table width="100%" cellpadding="0" cellspacing="0">${sections}</table>
    <p style="font-size: 12px; color: #999; margin-top: 24px;">
      <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
    </p>
  </body>
</html>`;
}

async function sendEmail(env, to, html) {
  const response = await fetchWithTimeout(
    RESEND_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.DIGEST_FROM_EMAIL || 'Daily Aggregator <digest@dailyaggregator.online>',
        to,
        subject: "Today's briefing — Daily Aggregator",
        html,
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${body}`);
  }
}

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const supabase = getSupabaseAdmin();
  const activeCategories = getActiveCategories();

  const [{ data: articles, error: articlesError }, { data: subscribers, error: subscribersError }] =
    await Promise.all([
      supabase.from('articles').select('category, headline, summary'),
      supabase
        .from('subscribers')
        .select('email, categories, token')
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null),
    ]);

  if (articlesError) throw new Error(`Failed to load articles: ${articlesError.message}`);
  if (subscribersError) throw new Error(`Failed to load subscribers: ${subscribersError.message}`);

  if (!subscribers || subscribers.length === 0) {
    console.log('send-digest: no confirmed subscribers, nothing to send.');
    return;
  }

  const articlesByCategory = {};
  for (const article of articles || []) {
    articlesByCategory[article.category] = article;
  }

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    // Empty categories array = "send everything active".
    const wanted =
      Array.isArray(subscriber.categories) && subscriber.categories.length > 0
        ? activeCategories.filter((c) => subscriber.categories.includes(c.slug))
        : activeCategories;

    const hasContent = wanted.some((c) => articlesByCategory[c.slug]);
    if (!hasContent) continue;

    // Cloudflare Pages Functions route: /unsubscribe (no /.netlify/functions/
    // prefix — that was Netlify-specific).
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.token}`;
    const html = renderDigestHtml(articlesByCategory, wanted, unsubscribeUrl);

    try {
      await sendEmail(process.env, subscriber.email, html);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`send-digest: failed to email ${subscriber.email}:`, err.message);
    }

    await sleep(DELAY_BETWEEN_EMAILS_MS);
  }

  console.log(`send-digest: sent ${sent}, failed ${failed}, total confirmed ${subscribers.length}.`);
}

main().catch((err) => {
  console.error('send-digest: fatal error:', err.message);
  process.exit(1);
});