-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query),
-- after supabase/schema.sql. This is a mailing list, not a login system —
-- there is no password and no session, just an email + a random token.

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  -- null/empty = "send every active category". Otherwise a subset of
  -- category slugs from lib/categories.js, e.g. {ai,crypto}.
  categories text[] not null default '{}',
  -- Doubles as the confirm-link token and the unsubscribe-link token.
  -- Regenerated on every unconfirmed signup attempt so old links stop working.
  token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_unique on subscribers (email);
create index if not exists subscribers_token_idx on subscribers (token);

-- No public select/insert/update policy on purpose. Row-level security stays
-- on, and all reads/writes go through the service_role key inside the
-- Netlify Functions (netlify/functions/subscribe.js, confirm.js,
-- unsubscribe.js) and scripts/send-digest.js — never the browser anon key.
alter table subscribers enable row level security;