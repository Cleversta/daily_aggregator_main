// Safe to import from client or server components. Uses the public ANON key,
// which is restricted by the "Public read access" row-level security policy
// in supabase/schema.sql (read-only, no writes).
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);
