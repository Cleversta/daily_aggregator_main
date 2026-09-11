# Guide draft and research workflow

## Start here

The workflow code is implemented and tested locally. The instructions below mix
one-time setup, normal use, and optional maintenance; they are not all unfinished
coding tasks. Production configuration and a real AI-generated guide have not
yet been verified.

To get the first guide working:

1. **Database:** run `supabase/guide_workflow.sql` in Supabase SQL Editor after
   the existing Guide schema. If you already ran it successfully, skip this.
2. **Admin access:** protect `/admin/*` with Cloudflare Access and allow only
your email. The Worker verifies Cloudflare's signed identity; Supabase is used
only for Guide storage. Reuse the existing Supabase and AI keys where configured.
   `GUIDE_GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash-lite`. Set
   `CLOUDFLARE_DEPLOY_HOOK_URL` in Cloudflare Pages for automatic rebuilding after
   publishing; a manual rebuild also works.
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

## Local admin testing

Run `npm run dev:worker`, then open `http://localhost:8787/admin/guide`.
Wrangler serves the exported site and the real Worker API together. Set
`LOCAL_GUIDE_ADMIN=true` only in the ignored `.env.local` file; the bypass is
also restricted in code to localhost. Re-run the command after frontend edits
so the static export is rebuilt. Production always requires Cloudflare Access.

## Deploy setup

1. In Supabase SQL Editor, run `supabase/guide_schema.sql` if the original Guide
   tables do not exist. Then run `supabase/guide_workflow.sql`. The latter is
   repeatable, preserves existing guides, and imports existing content as editable
   drafts. Back up your database before applying any production migration.
2. In Cloudflare Zero Trust, create a self-hosted Access application for
   `dailyaggregator.online/admin/*`. Add an Allow policy whose Include rule is
   the exact email `cleverstar02@gmail.com`; do not use an Everyone rule. Enable
   One-time PIN or Google as its login method. Copy the application's Audience
   tag. Cloudflare runtime settings need `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`,
   `GUIDE_ADMIN_EMAIL=cleverstar02@gmail.com`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `CLOUDFLARE_DEPLOY_HOOK_URL`. The build needs
   the existing Supabase credentials. `ADMIN_SECRET` and Supabase Auth login are
   not used by Guide administration. Redeploy the repository.
   The top-level `functions/` handlers require Pages Functions; `wrangler deploy`
   with the existing static Workers assets config alone does not deploy them.
3. GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and either
   the existing `TAVILY_API_KEY` / `GEMINI_API_KEY` or optional
   `TAVILY_GUIDE_API_KEY` / `GEMINI_GUIDE_API_KEY`. Separate key names do not grant
   extra provider quota. AI keys are not needed by the browser or Pages Function.
4. GitHub Actions variables: `GUIDE_GEMINI_MODEL` is optional and defaults to
   `gemini-3.5-flash-lite`, the model already used by News and Topics. Check the
   actual free-tier limits in AI Studio before overriding it.
   Optional `GUIDE_TAVILY_MONTHLY_LIMIT` defaults to 100 basic search attempts;
   `GUIDE_GEMINI_DAILY_LIMIT` defaults to 2 generation attempts. Zero pauses a
   provider. Budgets count Guide requests only, not News/Topics. No automatic
   paid-provider fallback is implemented. Disable paid overages in the provider
   account if a strict zero-cost setup is required.
5. Open `/admin/guide`, complete the Cloudflare Access login, and Load workspace.
   Click Prepare 15
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

## Content modes

The admin editor now supports:

- **Manual + Recommend:** editor-written answer sections or instructions;
  recommendations are optional. AI research is disabled.
- **AI Info + Recommend:** source-backed AI drafting with editor review;
  recommendations are optional.
- **Only Recommend:** a short introduction and at least one recommendation with
  reasons and supporting evidence. Instructions are hidden on the public page.

New blank guides start in Manual mode. Existing drafts without a mode retain
AI-capable behavior, as do starter drafts; this default is not an authorship claim.
Switching modes preserves draft instructions, so switching back restores them.
All modes require description, evidence sources, verification method/date, and
explicit review before publication. AI cannot choose the mode or mark content
verified. The existing version guards still prevent stale saves and AI overwrites.

### Required migration before deployment

Run `supabase/guide_content_modes.sql` after `guide_workflow.sql` in Supabase SQL
Editor. It adds the published mode and replaces the publication and queue RPCs.
It is repeatable and does not overwrite draft text. Apply it before deploying the
updated admin, Worker and research runner. This repository change does not run
the migration against production. Do not rerun the older workflow SQL afterward,
because it would replace the updated RPC definitions; reapply the mode migration
last if rebuilding the schema.

Save a draft, review it and its sources, then publish and verify the deployed
publication marker as before. Only Recommend may use AI to research links, but
still requires manual review. Scheduled AI review skips Manual drafts.

### Remaining roadmap

Built-in tools are separate from content mode. The image editor currently runs
on `compress-image` and `resize-photo`. The calculator is implemented at `/tools/calculator` and in the published
`calculate-percentage` guide. The unit converter is implemented at `/tools/unit-converter`. The color picker is implemented at `/tools/color-picker`. Christmas countdown is implemented at `/tools/christmas-countdown`. Currency rates, public IP lookup, and
nearby search require separate data or service integrations.

Next prepare five unpublished examples: a tool recommendation, explainer, recipe,
holiday, and current-information guide. For changing facts, record source and
retrieval time; for dates, specify country/year where relevant. AI is not a live
feed. Additional refresh controls and browser-tool selectors are not implemented.
