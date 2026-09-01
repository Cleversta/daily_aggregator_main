// Server-side only. Uses the SERVICE ROLE key, which bypasses row-level security.
// Never import this file into anything that runs in the browser.
const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

module.exports = { getSupabaseAdmin };
