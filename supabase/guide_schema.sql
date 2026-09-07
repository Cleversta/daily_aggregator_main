-- Guide feature schema — intents, search phrases, recommendations.
-- Run this in the Supabase SQL editor. Doesn't touch articles, topics,
-- or subscribers — fully separate tables.

create table if not exists guide_intents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,          -- 'images' | 'documents' | 'coding' | 'money' | 'writing' | 'design'
  description text,                -- 1-2 sentence "what you need" summary
  status text not null default 'draft',  -- 'draft' | 'review' | 'published'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists guide_search_phrases (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references guide_intents(id) on delete cascade,
  phrase text not null,
  created_at timestamptz default now()
);

create table if not exists guide_recommendations (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references guide_intents(id) on delete cascade,
  name text not null,
  url text not null,
  description text,                -- what it's best for
  reason text,                     -- why you're recommending it, in your own words
  rank int not null default 1,     -- 1 = top pick
  status text not null default 'published',  -- 'published' | 'disabled'
  is_stale boolean default false,  -- flagged by the weekly link check (dead URL)
  needs_review boolean default false,  -- flagged by the periodic freshness check (better option may exist)
  last_verified timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_guide_intents_slug on guide_intents(slug);
create index if not exists idx_guide_intents_status on guide_intents(status);
create index if not exists idx_guide_phrases_intent on guide_search_phrases(intent_id);
create index if not exists idx_guide_recs_intent on guide_recommendations(intent_id);

alter table guide_intents enable row level security;
alter table guide_search_phrases enable row level security;
alter table guide_recommendations enable row level security;

-- Public read-only, published content only — same pattern as articles/topics.
create policy "Public read access to published intents"
  on guide_intents for select
  using (status = 'published');

create policy "Public read access to search phrases"
  on guide_search_phrases for select
  using (true);

create policy "Public read access to published recommendations"
  on guide_recommendations for select
  using (status = 'published');

-- All writes go through the service-role key (build script, table editor) — never the anon key.