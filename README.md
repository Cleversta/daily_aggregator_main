# Daily Aggregator

Live at [dailyaggregator.online](https://dailyaggregator.online) — a once-a-day
briefing site. Started as a 3-category prototype (`ai`, `crypto`, `football`)
and has grown into a static Next.js site with an email digest, an evergreen
"Topics" reference section, and AI-prompt "Creator studio" cards for each
brief, hosted on Cloudflare Pages.

## Features implemented in this repository


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
- **Email digest** — no-login mailing list using Supabase and Resend. The send
  script exists; automated delivery and the unsubscribe route still need verification.
- **Guide image editor** — browser-only resize, compression, crop presets,
  crop positioning, 90° rotation, JPG/PNG/WebP export, automatic preview and
  actual output size on `/guide/compress-image` and `/guide/resize-photo`.
- Static pages: `/about`, `/editorial-policy`, `/privacy`, `/contact`, plus
  `/feed.xml`, `/robots.txt`, and a generated sitemap.

## Guide workflow

The Guide now supports private editable drafts, 15 starter tasks, queued Tavily/Gemini
research, editorial approval, and a Cloudflare rebuild after publishing. Run the
additional database migration and configure the worker before enabling it:
see [Guide setup and operations](GUIDE_WORKFLOW.md).

## Architecture

- **Frontend**: Next.js (App Router, `output: 'export'`) — reads Supabase
  **at build time** and ships flat HTML. No server-side rendering at runtime.
- **Hosting**: **Cloudflare Pages** (migrated from Netlify — see
  `CLOUDFLARE_MIGRATION.md` for the history). `wrangler.jsonc` points at the
  `out/` build directory.
- **Serverless functions**: `worker.js` routes subscribe, confirm, and Guide
  admin requests for the Worker deployment. `functions/` contains Pages handlers;
  the two deployment modes are not interchangeable. Unsubscribe is currently
  missing from the Worker router and must be verified before digest launch.
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
- `.github/workflows/topics-fetch.yml` — refreshes the current topic rotation
  daily at 06:00 UTC and requests a rebuild.
- Guide research and link-review workflows handle queued drafts and link checks.
- `send-digest.js` has no dedicated scheduled workflow; delivery needs separate setup.

## Setup

**Use the Node version in `.nvmrc`**: run `nvm install`, then `nvm use`.
Check with `node -v` before building.

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
5. **Run the site locally**: `npm run dev` for live Next.js UI updates.

   To test the Cloudflare Worker and its endpoints, use `npm run dev:worker`.
   This selects the installed Node version from `.nvmrc`, prints its path,
   builds the site, and serves a snapshot at `http://localhost:8787`. If that
   runtime is missing, run `nvm install` first. Cloudflare builds are unchanged.
   Stop the existing preview before starting another one. To reuse an already
   completed build, run `npm run preview:worker`. The preview uses
   `.wrangler/local-assets` so rebuilding `out` does not interrupt it.
   Restart with `npm run dev:worker` when you want the preview to include new UI changes.
6. **Deploy**: connect the repo to Cloudflare Pages (Workers & Pages →
   Create → Pages → Connect to Git; framework preset "Next.js (Static HTML
   Export)"; build command `npm run build`; output directory `out`). Add all
   the env vars above as Pages environment variables, and add the same
   secrets under GitHub Actions (Settings → Secrets and variables →
   Actions), plus a `CLOUDFLARE_DEPLOY_HOOK_URL` secret for the rebuild step.
   Full step-by-step in `CLOUDFLARE_MIGRATION.md`.

## Known limitations

- `/admin/guide` provides Guide draft review. This does not provide an equivalent
  editorial dashboard for every automated news or topic pipeline.
- No image optimization (static export doesn't support Next's image API) —
  images and video thumbnails render as plain `<img>` elements.
- `fetch-news.js` makes a single Gemini call per category with no retry —
  a transient failure marks that category stale for the day. (`fetch-topics.js`
  is more robust here: longer timeouts, retries with backoff, and strict
  JSON response mode — see `readme_topic.md`.)
- Digest delivery still needs scheduling. The Worker currently routes subscribe
  and confirm requests but has no unsubscribe handler; fix and verify it before
  relying on email subscriptions.
- Old `netlify/functions/` and Netlify-specific config are still in the repo
  but dead weight post-migration — safe to delete once Cloudflare is
  confirmed stable.

## Before scaling past 3 categories

- [ ] Fetch script has run cleanly (no aborted runs) for at least a week
- [ ] Site passed AdSense review with real content
- [ ] Checked actual Gemini free-tier quotas against 33 categories/day
- [ ] Decided who does the daily editorial pass, and what happens if they miss a day

### Build stability

The local Node 24.14.1 environment has intermittently crashed with SIGSEGV
and native V8 errors under both Turbopack and Webpack. Limiting static generation
to two workers did not eliminate the crashes. Production builds now explicitly
use the supported Webpack path while the runtime issue is investigated.

A Node 22 runtime is pinned in `.nvmrc` for local development:

```bash
nvm install
nvm use
npm run dev:worker
```

Node 22 has produced successful builds and the image tool has been tested by
the site owner. Later builds also reproduced SIGSEGV under Node 22, so neither
the runtime pin nor Webpack is a confirmed fix for the intermittent native crash.
Check each build result before starting a preview or deploying.

## Guide content modes and roadmap

The admin editor supports three content modes after applying
`supabase/guide_content_modes.sql` (after `guide_workflow.sql`):

1. **Manual + Recommend:** an editor-written answer with optional recommendations.
2. **AI Info + Recommend:** a source-backed AI draft, reviewed before publication.
3. **Only Recommend:** useful links with short reasons and relevant limitations;
   a long article is optional, but unexplained link lists are not the target.

A built-in tool is optional and separate from the content mode. The browser-tool roadmap includes a calculator, unit converter (excluding live currency rates),
HEX/RGB/HSL color picker, and Christmas countdown using the visitor’s clock.
These tools use deterministic code, not AI, for their calculations. The image editor and calculator are implemented; the other tools remain planned.

The Save draft → Review → Publish flow is preserved. Content mode is implemented;
optional-tool and refresh controls remain planned. Manual mode disables AI research;
Only Recommend hides instructions and requires evidence-backed recommendations. Start with five draft examples: a tool recommendation,
an explainer, a recipe guide, a holiday page, and a current-information page.
See [Guide workflow and content modes](GUIDE_WORKFLOW.md).

Time-sensitive topics will initially recommend current external sources. AI
may summarize retrieved information, but does not supply real-time prices,
release dates, public IP addresses, or nearby results by itself. API integrations,
location handling, and currency conversion are separate future work. The mode migration and editor are implemented locally; no production migration,
research job or deployment is run automatically by this change.

## Image tool behavior

Files are processed in the browser, without upload or AI calls. JPG, PNG, and
WebP inputs are limited to 25 MB and 40 megapixels; output is limited to 16
megapixels and 8,192 pixels per side. Crop coordinates refer to the original;
rotation follows cropping. Quality changes trigger a debounced preview encode,
and the displayed size is the actual generated file size, not a predicted saving.
PNG ignores the quality control and can make photographs larger. JPG flattens
transparency onto white. Animated inputs become still images; exports can change
metadata and colors. No guarantee of a smaller file or metadata sanitization is made.

Run `node --test tests/image-geometry.test.mjs` to check crop bounds and rotation
proportions. Also test preview, format export, download, and replacing/clearing a
file in a browser. Changes need a successful rebuild and preview restart before
they appear in `npm run dev:worker`.

## Browser calculator

Implemented at `/tools/calculator`, linked from Guides and site search, and
embedded in the published `calculate-percentage` guide. Supports addition,
subtraction, multiplication, division, percentage of a number, part/whole
percentage, and percentage change. Inputs stay in memory; copying is optional.
Results use browser floating-point arithmetic and display up to 12 significant
digits. No expression evaluation, API, subscription, or database migration is needed.

Run `node --test tests/calculator.test.mjs` for calculation and validation checks.
The unit converter is implemented at `/tools/unit-converter`. The color picker is implemented at `/tools/color-picker`. Christmas countdown is implemented at `/tools/christmas-countdown`.

## Browser unit converter

`/tools/unit-converter` converts length, avoirdupois weight, temperature readings,
volume, area, speed, fixed time durations, and digital storage using fixed factors. US liquid and Imperial gallons are explicitly separated; decimal and binary storage units are labelled. Results update
as values change; Swap units reverses the units while preserving the input.
Negative non-temperature values, temperatures below absolute zero, malformed
inputs and overflow are rejected. No API, database change, or saved history.
Run `node --test tests/unit-converter.test.mjs` to verify known conversions.

## Browser color picker

`/tools/color-picker` supports opaque 3/6-digit HEX, comma-separated integer RGB,
and comma-separated HSL with percentage saturation/lightness. Native color
selection, compact separate text/background controls, automatically applied valid
codes, a preview above the controls (sticky on taller screens), per-format copying,
and WCAG text contrast
checks run in the browser. Conversion uses 8-bit sRGB; contrast pass/fail uses the
unrounded ratio. Named colors, alpha, and wide-gamut formats are not supported.
Run `node --test tests/colors.test.mjs` for conversion and contrast fixtures.

## Christmas countdown

`/tools/christmas-countdown` uses the visitor’s device clock to count down to
local midnight on December 25, shows a greeting all Christmas Day, and selects
next year starting December 26. Hydration begins with a clock-loading message.
The interval recalculates from the current time; it does not subtract ticks.
No location permission, API, or stored history. Countdown days are 24-hour periods.
Run `node --test tests/christmas-countdown.test.mjs` for date-boundary tests.

## How long until

`/tools/countdown` expands the Christmas tool with international occasions and a
custom name/date. It runs locally; custom input is not saved or uploaded. The
original Christmas URL still works. Annual occasions repeat each year; custom
dates never automatically repeat. Occasions are not necessarily public holidays
in every country. No country-specific holiday calendar is included.
Run `node --test tests/event-countdown.test.mjs` for countdown boundaries.

The color picker also accepts local JPG/PNG/WebP photos for pixel sampling,
HEX/RGB copying, and applying a sampled color to the text/background preview.
Images are not uploaded or saved. Sampling uses a preview capped at 2,400 pixels
on its longest side, with transparency composited on white. Arrow keys select
pixels; Shift + arrow moves ten pixels. File limits: 25 MB / 40 megapixels.

## Date calculator

`/tools/date-calculator` supports signed date differences (displayed as an absolute
duration with direction), optional inclusive counting, adding/subtracting whole
calendar days, and age in completed years/months/days. Uses UTC date-only arithmetic
to avoid DST differences, supports years 1000–9999, and clamps month anniversaries
to the last valid day. All processing is local; inputs are not persisted.
Run `node --test tests/date-calculator.test.mjs`.
## Site trust and response security

The Cloudflare Worker redirects public HTTP and `www` requests to the canonical
HTTPS origin and adds CSP, clickjacking, MIME-sniffing, referrer, opener, and
browser-permission headers to static and API responses.

Automated news, topic, and guide research accepts sources only from the curated
list in `lib/source-trust.cjs`, including established publishers, official
organizations, and government or academic domains. Drafts can retain an unknown
domain for human correction, but publication rejects it. Add a domain only after
checking its ownership, editorial identity, and the exact evidence page. Existing
published database content is not silently deleted; refresh or review it separately.
