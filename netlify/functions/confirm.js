// netlify/functions/confirm.js
//
// GET /.netlify/functions/confirm?token=<uuid> -> marks that subscriber
// confirmed, then redirects to a plain confirmation page. The token in the
// link is the only "auth" here — there's no account to log into.

const { createClient } = require('@supabase/supabase-js');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gator.online';

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

exports.handler = async (event) => {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return { statusCode: 302, headers: { Location: `${SITE_URL}/?subscribed=invalid` } };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('subscribers')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('token', token)
    .is('unsubscribed_at', null)
    .select('email')
    .single();

  if (error || !data) {
    console.error('confirm: no matching pending subscriber for token');
    return { statusCode: 302, headers: { Location: `${SITE_URL}/?subscribed=invalid` } };
  }

  return { statusCode: 302, headers: { Location: `${SITE_URL}/?subscribed=confirmed` } };
};