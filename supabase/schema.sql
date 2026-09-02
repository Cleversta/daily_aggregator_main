-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  headline text not null,
  summary text not null,
  seo_title text,
  seo_description text,
  image_url text,
  video_url text,
  video_thumbnail_url text,
  sources jsonb not null default '[]'::jsonb, -- [{ "name": "BBC News", "url": "https://..." }]
  is_stale boolean not null default false,    -- true when today's fetch failed and we kept yesterday's data
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Safe to run in an existing prototype project created before video support.
alter table articles add column if not exists video_url text;
alter table articles add column if not exists video_thumbnail_url text;

-- One row per category: each day's run upserts (overwrites) the row for that category.
create unique index if not exists articles_category_unique on articles (category);

-- Public read access (the Next.js site reads with the anon key)
alter table articles enable row level security;

create policy "Public read access"
  on articles for select
  using (true);

-- Current public YouTube popularity lists and daily snapshots. Snapshots make
-- it possible to calculate weekly/monthly trends once enough history exists.
create table if not exists youtube_videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  category text not null,
  title text not null,
  channel_title text not null,
  thumbnail_url text,
  video_url text not null,
  published_at timestamptz,
  duration text,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  region_code text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (video_id, category, region_code)
);

create table if not exists youtube_trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  category text not null,
  region_code text not null,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  captured_on date not null,
  created_at timestamptz not null default now(),
  unique (video_id, category, region_code, captured_on)
);

-- Run these two statements on an already-created database that used the
-- previous Malaysia-only version of the schema.
alter table youtube_videos drop constraint if exists youtube_videos_video_id_category_key;
alter table youtube_trend_snapshots drop constraint if exists youtube_trend_snapshots_video_id_category_captured_on_key;
alter table youtube_videos add column if not exists duration text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'youtube_videos_video_id_category_region_code_key'
  ) then
    alter table youtube_videos add constraint youtube_videos_video_id_category_region_code_key unique (video_id, category, region_code);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'youtube_trend_snapshots_video_id_category_region_code_captured_on_key'
  ) then
    alter table youtube_trend_snapshots add constraint youtube_trend_snapshots_video_id_category_region_code_captured_on_key unique (video_id, category, region_code, captured_on);
  end if;
end $$;

create index if not exists youtube_videos_category_fetched_at_idx on youtube_videos (category, fetched_at desc);
create index if not exists youtube_snapshots_captured_on_idx on youtube_trend_snapshots (captured_on desc);

alter table youtube_videos enable row level security;
alter table youtube_trend_snapshots enable row level security;

create policy "Public read YouTube videos"
  on youtube_videos for select
  using (true);

-- No public insert/update/delete policy is created on purpose.
-- Only the service_role key (used by scripts/fetch-news.js, never exposed to the browser)
-- can write to this table.
