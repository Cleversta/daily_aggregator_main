# Guide draft and research workflow

## Start here

The workflow code is implemented and tested locally. The instructions below mix
one-time setup, normal use, and optional maintenance; they are not all unfinished
coding tasks. Production configuration and a real AI-generated guide have not
yet been verified.

To get the first guide working:

1. **Database:** run `supabase/guide_workflow.sql` in Supabase SQL Editor after
   the existing Guide schema. If you already ran it successfully, skip this.
2. **Configuration:** reuse the existing Supabase and AI keys where configured.
   Set `GUIDE_GEMINI_MODEL` in GitHub Actions variables. Set
   `CLOUDFLARE_DEPLOY_HOOK_URL` in Cloudflare Pages for automatic rebuilding after
   publishing; a manual rebuild also works. Existing working `ADMIN_SECRET`
   settings do not need to be replaced.
3. **Deploy and try one guide:** deploy these changes, open `/admin/guide`,
   prepare the starter drafts, and research just one. Review it before publishing.

Leave automatic content review disabled initially. You do not need new AI
providers, separate API keys, or to publish all 15 guides to test the feature.

## How it works

The public site reads published guide rows at build time. Admin edits live in
private `guide_drafts`; research never changes the published tables. Publishing
replaces an intent's recommendations and search phrases in one transaction.
A version check rejects stale editor saves and prevents AI jobs from overwriting
edits made while research was running.

## Deploy setup

1. In Supabase SQL Editor, run `supabase/guide_schema.sql` if the original Guide
   tables do not exist. Then run `supabase/guide_workflow.sql`. The latter is
   repeatable, preserves existing guides, and imports existing content as editable
   drafts. Back up your database before applying any production migration.
2. Cloudflare **Pages** runtime settings need `ADMIN_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `CLOUDFLARE_DEPLOY_HOOK_URL`. The build needs the
   existing Supabase public and service credentials. Redeploy the repository.
   The top-level `functions/` handlers require Pages Functions; `wrangler deploy`
   with the existing static Workers assets config alone does not deploy them.
3. GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and either
   the existing `TAVILY_API_KEY` / `GEMINI_API_KEY` or optional
   `TAVILY_GUIDE_API_KEY` / `GEMINI_GUIDE_API_KEY`. Separate key names do not grant
   extra provider quota. AI keys are not needed by the browser or Pages Function.
4. GitHub Actions variables: set `GUIDE_GEMINI_MODEL` to a model available to your
   API account. Check the actual free-tier limits in AI Studio before choosing.
   Optional `GUIDE_TAVILY_MONTHLY_LIMIT` defaults to 100 basic search attempts;
   `GUIDE_GEMINI_DAILY_LIMIT` defaults to 2 generation attempts. Zero pauses a
   provider. Budgets count Guide requests only, not News/Topics. No automatic
   paid-provider fallback is implemented. Disable paid overages in the provider
   account if a strict zero-cost setup is required.
5. Open `/admin/guide`, enter the password and Load workspace. Click Prepare 15
   starter drafts once. This creates task shells without consuming AI quota or
   publishing unverified content; repeat clicks preserve existing drafts.
6. Open **Make a photo smaller**, then Research with AI. Run the **Guide research
   queue** workflow manually for the first test, or wait for its six-hour schedule.
   Refresh the workspace and reopen the saved draft when it says `review`.
7. Read the source pages, verify every recommendation and instruction, edit the
   draft, select the verification method and actual date, and check the review
   checkbox. “Unknown” is appropriate for unsupported signup/privacy/limit claims.
   Never mark AI output as personally tested without doing the test yourself.
8. Publish reviewed guide saves the public revision and requests a rebuild.
   “Check live publication” reads the deployed guide HTML and compares its
   publication ID to the saved revision. A deploy-hook response is never treated
   as proof that the build succeeded. Retry rebuild is safe without duplicating
   recommendations. Inspect the resulting page and `/sitemap.xml`.
9. Repeat for the remaining 14 drafts. Optionally set `GUIDE_AUTO_REVIEW=true` to
   queue one published guide older than 14 days per UTC day. The reviewed draft
   stays private until another approval; drafts awaiting review are not rotated.

## Queue behavior and limits

The worker processes at most two jobs per invocation. Supabase atomically claims
jobs and reserves each provider request before it is sent. Reservations include
failed/uncertain calls and are not refunded. Tavily sources are saved on the job,
so a Gemini retry doesn't repeat the search. Sources are excerpts from search,
not a guarantee of official provenance: the editor must inspect them. AI evidence
links must match those returned by research. Output never sets verification.

A local-budget or provider-quota response waits 24 hours without consuming a
processing attempt. Transient failures retry after one hour, with three attempts
maximum; common invalid-key/model errors stop immediately. A killed worker's
lease expires after 15 minutes. Manual and scheduled runs share database counters.
UTC-based local counters differ from provider reset periods; provider limits
still apply. Keep headroom for other apps using the same account.

The weekly **Guide link review** workflow uses no AI. It flags failed URLs for
review and records `link_checked_at`, not `last_verified`. HTTP success cannot
verify pricing or features. Flags appear on public pages after the next rebuild;
they do not automatically hide recommendations. Open flagged recommendations from the admin review list; republish only after
checking or replacing the affected tools. Existing stale flags from
older versions remain respected by the public page.

## Local checks

- `npm run test:guide`: fake-provider tests, no API calls or writes.
- `node tests/build-guide.mjs`: full build using a local synthetic Supabase server;
  restores the prior build folders and search index afterwards. Requires local ports.
- `tests/guide-database.sql`: integration assertions in a disposable Postgres
  database after installing the schemas and Supabase-equivalent roles/grants.
- `npm run process-guide-jobs`: REAL queued jobs and API requests, using `.env.local`.
- `npm run build`: reads the configured Supabase database and writes static assets.

No live data, production migration, AI-provider call, or deployment is performed
by the unit tests. All 15 starters are research candidates, not independently
verified top-volume search keywords.
