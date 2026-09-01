# Daily Aggregator — 3-category prototype

This is the scoped-down starting point we agreed on: **3 categories** (`ai`,
`crypto`, `football` — one per rough ad-CPM tier), not all 33. Prove this
works end-to-end and passes AdSense review before expanding
`CATEGORIES` in `scripts/fetch-news.js`.

## What this includes

- `scripts/fetch-news.js` — daily job: Tavily search → Gemini summary → Supabase upsert.
  Fixed from the earlier draft: correct Tavily endpoint, a real circuit breaker
  (aborts after 5 consecutive failures instead of just skipping one), a delay
  between categories, request timeouts, and a stale-content fallback so a
  failed category keeps yesterday's article live instead of going blank.
- `supabase/schema.sql` — the `articles` table, one row per category, public
  read-only via row-level security.
- `app/` — a minimal Next.js static site (App Router, `output: 'export'`)
  that reads from Supabase **at build time** and renders flat HTML.
- `.github/workflows/daily-fetch.yml` — runs the fetch script at 5:00 AM UTC,
  then pings a Netlify build hook to rebuild the static site.

## Setup

**Requires Node.js 20+** (Next.js 16 minimum). Check with `node -v`.

1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL editor.
2. **Tavily**: get a free API key at tavily.com.
3. **Gemini**: get a free API key at aistudio.google.com.
4. **Local env**: `cp .env.example .env.local` and fill in all values.
5. **Install & test the fetch script locally**:
   ```bash
   npm install
   npm run fetch-news
   ```
   Check the `articles` table in Supabase — you should see 3 rows.
6. **Run the site locally**:
   ```bash
   npm run dev
   ```
7. **Deploy**: push to GitHub, connect the repo to Netlify (build command
   `npm run build`, publish directory `out`), then add the same env vars as
   GitHub Actions secrets (Settings → Secrets and variables → Actions) plus
   a Netlify build hook URL as `NETLIFY_BUILD_HOOK_URL`.

## UI included

- `lib/categories.js` — the full 6-hub/33-category map from the approved nav
  design, with `active: true` on the 3 live categories. Add `active: true`
  to more categories here as you expand `CATEGORIES` in `scripts/fetch-news.js`
  — no other UI changes needed.
- `app/components/Navbar.js` — tap a hub to expand its categories; live ones
  link out, inactive ones show as "soon" instead of a dead link.
- `app/page.js` — homepage grouped by hub, only showing hubs with at least
  one live category, with a "coming soon" line listing the rest.
- `app/category/[slug]/page.js` — full detail page per category (headline,
  optional image or video thumbnail, summary, sources), statically generated for active categories only.

## Before scaling to 33 categories

- [ ] Fetch script has run cleanly (no aborted runs) for at least a week
- [ ] Site has been submitted for AdSense review with real (even if manually
      touched-up) content, and approved
- [ ] Checked actual Tavily/Gemini free-tier quotas against 33 categories/day,
      not the headline numbers
- [ ] Decided who does the daily editorial pass, and what happens if they miss a day
      (the stale-content fallback already covers this — confirm it's enough)

## Known limitations of this prototype

- No editorial-review admin dashboard yet — the "5-minute human pass" from
  the risk mitigation plan isn't built. For now, review rows directly in the
  Supabase table editor before the site rebuilds if you want to hand-edit anything.
- No image optimization (static export doesn't support Next's image API) —
  images and video thumbnails render as plain `<img>` elements. Video thumbnails
  are currently detected for YouTube source links only.
- Single Gemini call per category, no retry-with-backoff — a transient
  failure marks that category stale for the day rather than retrying.
