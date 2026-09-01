-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  headline text not null,
  summary text not null,
  seo_title text,
  seo_description text,
  image_url text,
  sources jsonb not null default '[]'::jsonb, -- [{ "name": "BBC News", "url": "https://..." }]
  is_stale boolean not null default false,    -- true when today's fetch failed and we kept yesterday's data
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One row per category: each day's run upserts (overwrites) the row for that category.
create unique index if not exists articles_category_unique on articles (category);

-- Public read access (the Next.js site reads with the anon key)
alter table articles enable row level security;

create policy "Public read access"
  on articles for select
  using (true);

-- No public insert/update/delete policy is created on purpose.
-- Only the service_role key (used by scripts/fetch-news.js, never exposed to the browser)
-- can write to this table.
