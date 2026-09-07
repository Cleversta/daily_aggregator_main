# Daily Aggregator

Live at [dailyaggregator.online](https://dailyaggregator.online) — a once-a-day
briefing site. Started as a 3-category prototype (`ai`, `crypto`, `football`)
and has grown into a static Next.js site with an email digest, an evergreen
"Topics" reference section, and AI-prompt "Creator studio" cards for each
brief, hosted on Cloudflare Pages.

## What's live right now

- **3 active categories** out of a planned 33: `ai`, `crypto`, `football`
  (see `lib/categories.js` for the full 6-hub map — everything else renders
  as "coming soon" in the nav until it's turned on).
- **Daily briefs** — Tavily research → Gemini summary → Supabase, rendered as
  a static site.
- **YouTube trends** (`/youtube`) — daily popular-video snapshots across 8
  country charts; videos trending in 2+ markets surface as "Hot right now."
- **Topics** (`/topics`, `/topic/[slug]`) — 100 evergreen reference pages
  (e.g. Claude AI, Bitcoin) refreshed on a 5-day rotation, isolated from the
  daily pipeline's API quota.
- **Creator studio** — ready-to-use AI prompts (YouTube Shorts, TikTok,
  Instagram Reel scripts) generated per brief, with copy/save-to-browser
  functionality.
- **Email digest** — no-login mailing list (Supabase `subscribers` table +
  Resend) with confirm/unsubscribe via token links, sent once a day.
- Static pages: `/about`, `/editorial-policy`, `/privacy`, `/contact`, plus
  `/feed.xml`, `/robots.txt`, and a generated sitemap.

## Architecture

- **Frontend**: Next.js (App Router, `output: 'export'`) — reads Supabase
  **at build time** and ships flat HTML. No server-side rendering at runtime.
- **Hosting**: **Cloudflare Pages** (migrated from Netlify — see
  `CLOUDFLARE_MIGRATION.md` for the history). `wrangler.jsonc` points at the
  `out/` build directory.
- **Serverless functions**: `functions/` (Cloudflare Pages Functions) handle
  `subscribe` / `confirm` / `unsubscribe`. The old `netlify/functions/`
  equivalents are still in the repo but unused — safe to delete once you've
  confirmed Cloudflare is fully cut over.
- **Data**: Supabase (Postgres), row-level security on, all writes go through
  the service-role key server-side — never the browser anon key.
- **Content pipelines** (all in `scripts/`, run as scheduled jobs):
  - `fetch-news.js` — daily briefs. Circuit breaker (aborts after 5
    consecutive failures), per-category timeouts, stale-content fallback
    (a failed category keeps yesterday's article instead of going blank).
  - `fetch-youtube.js` — YouTube trend snapshots.
  - `fetch-topics.js` — the 100-topic rotation (`--all` flag seeds every
    topic at once instead of waiting for the 5-day cycle).
  - `send-digest.js` — emails confirmed subscribers their daily categories
    via Resend.

## GitHub Actions (what's actually automated)

- `.github/workflows/daily-fetch.yml` — runs `fetch-news.js` at 5:00 AM UTC,
  then hits a Cloudflare Pages deploy hook to rebuild the site.
- `.github/workflows/youtube-fetch.yml` — runs `fetch-youtube.js` daily at
  5:30 AM UTC.
- **Not yet automated**: `fetch-topics.js` and `send-digest.js` have no
  workflow file — they currently need to be run manually (or you can add
  steps/schedules for them; see `readme_topic.md` for a suggested workflow
  snippet for topics).

## Setup

**Requires Node.js 20+** (Next.js 16 minimum). Check with `node -v`.

1. **Supabase**: create a project, then run `supabase/schema.sql` and
   `supabase/subscribers.sql` in the SQL editor. If you want Topics too,
   also run `supabase/topics_schema.sql` (see `readme_topic.md`).
2. **API keys**: Gemini (aistudio.google.com), Tavily (tavily.com), YouTube
   Data API, and Resend (for the digest email).
3. **Local env**: `cp .env.example .env.local` and fill in every value.
   Note the example file is missing a few keys the code actually uses —
   add these too:
   ```
   NEXT_PUBLIC_SITE_URL=https://dailyaggregator.online
   RESEND_API_KEY=your_resend_api_key
   DIGEST_FROM_EMAIL=Daily Aggregator <digest@dailyaggregator.online>
   ```
   And if you're running Topics, its own **separate, dedicated** free-tier
   keys (do not reuse your news-pipeline keys — see `readme_topic.md`):
   ```
   TAVILY_TOPICS_API_KEY=your_new_tavily_key
   GEMINI_TOPICS_API_KEY=your_new_gemini_key
   ```
4. **Install & test the pipelines locally**:
   ```bash
   npm install
   npm run fetch-news        # should populate 3 rows in `articles`
   npm run fetch-youtube     # populates YouTube trend snapshots
   npm run fetch-topics      # today's ~20-topic rotation (needs topics_schema.sql)
   npm run fetch-topics:all  # one-time: seed all 100 topics at once
   npm run send-digest       # emails confirmed subscribers (needs subscribers.sql + Resend)
   ```
5. **Run the site locally**: `npm run dev`
6. **Deploy**: connect the repo to Cloudflare Pages (Workers & Pages →
   Create → Pages → Connect to Git; framework preset "Next.js (Static HTML
   Export)"; build command `npm run build`; output directory `out`). Add all
   the env vars above as Pages environment variables, and add the same
   secrets under GitHub Actions (Settings → Secrets and variables →
   Actions), plus a `CLOUDFLARE_DEPLOY_HOOK_URL` secret for the rebuild step.
   Full step-by-step in `CLOUDFLARE_MIGRATION.md`.

## Known limitations

- No editorial-review admin dashboard — review rows directly in the
  Supabase table editor before a rebuild if you want to hand-edit anything.
- No image optimization (static export doesn't support Next's image API) —
  images and video thumbnails render as plain `<img>` elements.
- `fetch-news.js` makes a single Gemini call per category with no retry —
  a transient failure marks that category stale for the day. (`fetch-topics.js`
  is more robust here: longer timeouts, retries with backoff, and strict
  JSON response mode — see `readme_topic.md`.)
- Topics and digest sends aren't on a GitHub Actions schedule yet — manual
  `npm run` for now.
- Old `netlify/functions/` and Netlify-specific config are still in the repo
  but dead weight post-migration — safe to delete once Cloudflare is
  confirmed stable.

## Before scaling past 3 categories

- [ ] Fetch script has run cleanly (no aborted runs) for at least a week
- [ ] Site passed AdSense review with real content
- [ ] Checked actual Gemini free-tier quotas against 33 categories/day
- [ ] Decided who does the daily editorial pass, and what happens if they miss a day
