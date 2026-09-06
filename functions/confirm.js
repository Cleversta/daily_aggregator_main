// functions/confirm.js
//
// Cloudflare Pages Function, reachable at GET /confirm?token=... (matches
// the /confirm path used in subscribe.js's confirm link — no
// /.netlify/functions/ prefix here, unlike the old Netlify version).
//
// Marks that subscriber confirmed, then redirects to a friendly page. The
// token in the link is the only "auth" — there's no account to log into.

import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://dailyaggregator.online';

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.redirect(`${siteUrl}/?subscribed=invalid`, 302);
  }

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

  if (error || !data) {
    console.error('confirm: no matching pending subscriber for token');
    return Response.redirect(`${siteUrl}/?subscribed=invalid`, 302);
  }

  return Response.redirect(`${siteUrl}/?subscribed=confirmed`, 302);
}