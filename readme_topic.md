# Topics feature — setup

This adds a second content type to daily_aggregator_main: 100 evergreen
reference pages (Claude AI, Bitcoin, Taylor Swift, etc.), checked on a
5-day rotation instead of daily, sitting alongside your existing daily
category briefings. Nothing in the existing news pipeline is touched.

## Files in this bundle

New:
- `supabase/topics_schema.sql`
- `lib/topics.js`
- `scripts/fetch-topics.js`
- `app/topic/[slug]/page.js`
- `app/topics/page.js`

Modified (copy these over your existing versions):
- `package.json` — added the `fetch-topics` script
- `app/components/Navbar.js` — added a "Topics" link

## Setup steps

1. **Drop these files into your repo** at the matching paths (same
   structure as this bundle).

2. **Run the SQL migration**: open the Supabase SQL editor and run
   `supabase/topics_schema.sql`. This adds two new tables (`topics`,
   `topic_snapshots`) — your existing `articles` and `youtube_videos`
   tables are untouched.

3. **Create two new, separate free-tier keys — do not reuse your existing
   ones**: this keeps Topics fully on free-tier quota, isolated from your
   paid news-pipeline usage.
   - **Tavily**: sign up a new account (different email) at tavily.com →
     free tier gives 1,000 credits/month, no card required.
   - **Gemini**: create a new Google Cloud project (a new API key inside
     your *existing* project shares its quota — a genuinely separate
     project is what gives you a separate free-tier allowance) →
     generate a key at aistudio.google.com under that new project.
   - Add both to `.env.local` (and as GitHub Actions secrets) as:
     ```
     TAVILY_TOPICS_API_KEY=your_new_tavily_key
     GEMINI_TOPICS_API_KEY=your_new_gemini_key
     ```
   - Your existing `TAVILY_API_KEY` / `GEMINI_API_KEY` stay exactly as
     they are, used only by `fetch-news.js`.

4. **Test locally**:
   ```bash
   npm run fetch-topics
   ```
   This checks whichever ~20 topics belong to *today's* rotation group
   (deterministic by date — see `getTodaysRotationGroup()` in
   `lib/topics.js`). Check the `topics` table in Supabase for new rows.

   **To seed all 100 at once** (e.g. for the initial launch, instead of
   waiting 5 days for the rotation to cover everything):
   ```bash
   npm run fetch-topics:all
   ```
   This ignores the rotation group and checks every topic in one run.
   Since none of them have a prior snapshot yet, all 100 will call
   Gemini (no diff to skip against) — that's expected for a first seed,
   just note it uses up to 100 Tavily credits + 100 Gemini calls in one
   go. After this initial seed, go back to the normal daily
   `npm run fetch-topics` (20/day rotation) for ongoing updates.

5. **Run the site locally** and visit `/topics` and `/topic/claude-ai`
   (or any other slug from `lib/topics.js`).

6. **Add to your GitHub Actions workflow** — either add a step to
   `.github/workflows/daily-fetch.yml` right after the `fetch-news`
   step:
   ```yaml
   - run: npm run fetch-topics
     env:
       TAVILY_TOPICS_API_KEY: ${{ secrets.TAVILY_TOPICS_API_KEY }}
       GEMINI_TOPICS_API_KEY: ${{ secrets.GEMINI_TOPICS_API_KEY }}
       SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
       SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
   ```
   or duplicate the workflow file for a separate schedule — up to you.

## Reliability fixes (after the first --all run)

The first `--all` run showed three failure patterns, now fixed in the script:

1. **"This operation was aborted" (timeout)** — the free-tier Gemini key
   getting momentarily rate-limited under 100 rapid requests caused some
   responses to queue past the old 20s timeout. Fixed with: a longer
   45s timeout specifically for Gemini calls (Tavily keeps 20s), a longer
   2.5s gap between topics, and up to 2 automatic retries with backoff on
   any transient failure.
2. **"Tavily returned too few usable sources"** — broad reference topics
   (e.g. "Electric vehicles") often don't have coverage in the exact last
   7 days. Fixed by defaulting to a `month` time range, and falling back
   to an unrestricted search if that's still thin.
3. **"Gemini response was not valid JSON"** — some responses were getting
   cut off or padded with stray text. Fixed by forcing Gemini's strict
   JSON response mode (`responseMimeType: 'application/json'`), raising
   the output token limit, and detecting/rejecting truncated responses
   explicitly so they retry instead of silently failing to parse.

If a topic still fails after retries, it's marked `is_stale` and keeps
whatever content it had before (or stays empty on a true first run) —
the run continues to the next topic rather than stopping.

## How the rotation & cost-saving logic works

- With its own dedicated Tavily key, the Topics feature's 20 credits/day
  (600/month) sits well inside the 1,000/month free tier, with room to
  spare — no need to shrink the rotation to make this fit.
- `lib/topics.js` splits the 100 topics into 5 rotation groups of 20.
  `getTodaysRotationGroup()` derives which group runs today from the
  date itself, so no external state is needed — the schedule is stable
  and automatic.
- Each day's run only touches its ~20 topics, checking each once
  against Tavily.
- If the returned source URLs match what was stored in `topic_snapshots`
  last time, **Gemini is never called** for that topic that day — only
  `last_checked_at` and `freshness_note` update ("Checked, no major
  changes"). This is what keeps you inside free-tier quotas at 100
  topics.
- If the URLs changed (or it's the topic's first run ever), Gemini
  generates the full content and a new snapshot is stored.

## Adjusting the pace

- Want fresher content sooner? Lower `ROTATION_GROUPS` in
  `lib/topics.js` (e.g. `3` instead of `5` checks each topic roughly
  twice as often, but also roughly doubles Tavily usage).
- Want to swap the 3 placeholder "trending actor / musician / athlete"
  slots? They're the last three entries in `RAW_TOPICS` in
  `lib/topics.js` (`isRotatingSlot: true`) — just edit the `slug` and
  `topicName` by hand when you want to pick someone new. Auto-detecting
  who's currently trending is a reasonable v2 addition, left out of
  this version to keep the first build simple.