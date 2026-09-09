# Cloudflare Pages migration — setup

Goal: get this running on Cloudflare Pages on a free `.pages.dev` test URL,
fully working, before touching your live domain. Netlify stays untouched
and keeps serving `dailyaggregator.online` the whole time.

## Files in this bundle (replace/add at these paths in your repo)

```
functions/subscribe.js       replaces netlify/functions/subscribe.js's job
functions/confirm.js         replaces netlify/functions/confirm.js's job
functions/unsubscribe.js     replaces netlify/functions/unsubscribe.js's job
app/components/Subscribe.js  updated fetch path (/subscribe, no netlify prefix)
scripts/send-digest.js       updated unsubscribe link path
```

Note: you can leave the old `netlify/functions/` folder in place for now —
Cloudflare Pages only looks at the top-level `functions/` folder, so the two
don't conflict. Delete `netlify/functions/` later once you've fully cut
over and disconnected Netlify.

## Steps

1. **Copy the files above into your repo** at the paths shown, then:
   ```bash
   git add functions app/components/Subscribe.js scripts/send-digest.js
   git commit -m "Add Cloudflare Pages Functions alongside Netlify"
   git push
   ```

2. **Sign up at Cloudflare** (dash.cloudflare.com) if you haven't — free,
   no card needed for Pages.

3. **Connect your repo:**
   - Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
   - Pick `Cleversta/daily_aggregator_main`
   - Build settings:
     - Framework preset: **Next.js (Static HTML Export)**
     - Build command: `npm run build`
     - Build output directory: `out`
   - Don't deploy yet — first add environment variables (next step),
     or add them right after the first deploy and redeploy once.

4. **Add environment variables** — Pages project → **Settings** →
   **Environment variables** → add for **Production** (and optionally
   Preview too):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `DIGEST_FROM_EMAIL` → `Daily Aggregator <digest@dailyaggregator.online>`
   - `NEXT_PUBLIC_SITE_URL` → for now, leave this as your `.pages.dev` URL
     once you know it (see next step), so confirm/unsubscribe links point
     at the right place during testing. You'll change this to
     `https://dailyaggregator.online` only at final cutover.
   - `NEXT_PUBLIC_CONTACT_EMAIL`
   - `GEMINI_API_KEY`, `GEMINI_TOPICS_API_KEY`, `TAVILY_API_KEY`,
     `YOUTUBE_API_KEY` if your build needs them at build time (check your
     `fetch-*.js` scripts — likely not needed for the Pages build itself,
     only for the separate GitHub Action).

5. **Deploy.** Cloudflare gives you a URL like
   `https://daily-aggregator-main.pages.dev` (or similar) once the first
   build finishes. Update `NEXT_PUBLIC_SITE_URL` to that exact URL, then
   trigger a redeploy (Pages → Deployments → Retry/redeploy latest) so the
   confirm/unsubscribe links get built with the right domain.

6. **Test on the `.pages.dev` URL** — exactly like before:
   - Submit the Subscribe form with a real email
   - Check inbox for the confirm email (link should point at your
     `.pages.dev` domain now)
   - Click confirm → redirects to `<pages.dev>/?subscribed=confirmed`
   - Check Supabase `subscribers` table → `confirmed_at` filled in
   - Run `npm run send-digest` locally (update your local `.env.local`'s
     `NEXT_PUBLIC_SITE_URL` to the `.pages.dev` URL temporarily for this
     test) → confirm the digest arrives, and its unsubscribe link also
     points at the right domain

## Once everything checks out on `.pages.dev`

### Guide admin setup

`/admin/guide` uses Cloudflare Access. Create a self-hosted Access application
for `dailyaggregator.online/admin/*`, allow only `cleverstar02@gmail.com`, and
configure `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, and
`GUIDE_ADMIN_EMAIL=cleverstar02@gmail.com` in the Worker. The Function needs
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for storage. It does not use a
Cloudflare admin password or Supabase Auth login.
After saving a guide, rebuild the site to publish its static page and search
index.

7. **Point your real domain at Cloudflare:**
   - Pages project → **Custom domains** → **Add a custom domain** →
     enter `dailyaggregator.online`
   - Cloudflare will ask you to either change nameservers at Namecheap to
     Cloudflare's, or add a CNAME — follow whichever option it presents
     (nameserver change is more common for Pages custom domains and gives
     you Cloudflare's CDN/WAF too)
   - Wait for DNS to propagate (can take a few minutes to a few hours)

8. **Update env vars for production:**
   - `NEXT_PUBLIC_SITE_URL` → `https://dailyaggregator.online`
   - Redeploy

9. **Update the GitHub Action** (`.github/workflows/daily-fetch.yml`):
   - Replace the `Trigger Netlify rebuild` step's `curl` target with a
     Cloudflare Pages deploy hook. Get one from: Pages project →
     **Settings** → **Builds & deployments** → **Deploy hooks** → create
     one → copy the URL into a new GitHub secret,
     e.g. `CLOUDFLARE_DEPLOY_HOOK_URL`.
   - Change the step to:
    ```yaml
     - name: Trigger Cloudflare Pages rebuild
       run: curl -X POST -fsS "${{ secrets.CLOUDFLARE_DEPLOY_HOOK_URL }}"
     ```

10. **Disconnect Netlify** (optional, once fully confident):
    - Netlify → Site settings → General → Danger zone → stop the site
      from auto-deploying, or delete the site entirely once
      `dailyaggregator.online` is confirmed live on Cloudflare.
    - Delete the now-unused `netlify/functions/` folder and
      `netlify.toml` from your repo.

## What did NOT change

- Your Next.js pages, components, styling — untouched
- Supabase schema and queries — untouched
- Resend usage — untouched
- `fetch-news.js` — untouched (still a separate GitHub Action step, still
  the thing to fix separately for its Gemini 401 issue)
- The "no accounts, just a mailing list with token-based links" design —
  untouched, same as before

Only the *hosting platform* and the *three tiny function files'* export
syntax changed.
