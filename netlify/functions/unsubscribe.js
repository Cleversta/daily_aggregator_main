// netlify/functions/unsubscribe.js
//
// GET /.netlify/functions/unsubscribe?token=<uuid> -> stamps unsubscribed_at
// so scripts/send-digest.js skips this row from then on. The token is baked
// into every digest email's footer link — no login required to opt out.

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

  const { error } = await supabase
    .from('subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('token', token);

  if (error) {
    console.error('unsubscribe: update failed:', error.message);
  }

  return { statusCode: 302, headers: { Location: `${SITE_URL}/?subscribed=removed` } };
};