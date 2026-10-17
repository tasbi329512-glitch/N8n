# 10. Deployment instructions — Flowmint (n8n-clone)

**Project:** Flowmint — static marketing site with optional Node lead-capture API
**Deploy unit:** `~/workspace/n8n-clone/` (project root)
**Status:** Prepared for deployment. **NOT DEPLOYED** — awaiting the user's explicit
authorization of the target before anything is pushed live.

## 1. What is being deployed

| Component | Location | Deploy shape | Build step |
|---|---|---|---|
| Static marketing site (9 pages + 108 generated detail pages) | `source/` (3.1 MB) | Static files | **None** — serve as-is |
| Lead-capture API (`POST /api/forms`, `GET /api/health`) | `api/server.js` | Optional Node server | None (zero dependencies, Node ≥ 18) |
| Detail-page generator + smoke tests | `scripts/` | Dev tooling only | Not deployed |
| PostgreSQL schema + 6 migrations | `source/db/` | Optional backend phase | Not deployed (static build ignores it) |

Verified facts (from `npm test`, run 2026-10-17): smoke suite passes end-to-end —
server boots, `GET /api/health` → `{"ok":true}`, all form types submit and
persist to the JSONL store, invalid input is rejected (422), no raw IPs stored.

## 2. Recommended target — Vercel (free Hobby plan)

**Why Vercel:** a Vercel connector is already available in this environment
(`/opt/hatch/bin/vercel`), the site needs no build step, and Vercel's global CDN
serves the fully-static `source/` directory with zero configuration. Hobby is free
for personal/hobby projects and includes monthly bandwidth and build-minute caps
(see https://vercel.com/pricing for current limits).

**Deploy configuration prepared for this target:**

| File | Purpose |
|---|---|
| `vercel.json` | `outputDirectory: "source"`, clean URLs, security headers (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`), cache rules (immutable for `/assets/*`, 1 day for `/css/*` and `/js/*`, 1 hour for `/data/*.json`) |
| `.vercelignore` | Excludes `api/`, `scripts/`, `reports/`, etc. so Vercel does not try to build `api/server.js` as a serverless function (it is a standalone long-lived server, not a function) |
| `.env.example` | Runtime config template — no real secrets; **no env vars are required for the static deploy** |

CSP notes: the site uses Google Fonts (Manrope), so `font-src` allows
`fonts.gstatic.com` and `style-src` allows `fonts.googleapis.com` plus
`'unsafe-inline'` (the pages use inline `style` attributes; there are no inline
`<script>` blocks, verified by scan). Same-origin `fetch()` calls to
`/data/*.json` and `/api/forms` are covered by `connect-src 'self'`.

**Known behavior on the static target:** the lead-capture API does not run on
Vercel's static hosting, so forms will show the site's built-in honest message
("could not reach our server") instead of faking success. This is the behavior
the codebase documents and the repair pass verified — nothing is silently broken.

## 3. Pre-launch checklist (do before deploying)

- [ ] **Production domain:** `source/sitemap.xml` and `source/robots.txt` reference
      the placeholder domain `https://flowmint.io/`. Replace with the real domain
      (or leave the vercel.app URL) before launch; regenerate is not needed, just
      edit the two files. `SITE_URL` in `.env.example` documents this.
- [ ] **Pricing data:** `source/data/pricing.json` mirrors the reference's published
      list prices — re-verify against the reference before production use (the site
      README flags this explicitly).
- [ ] **Forms decision:** confirm static-only (forms degrade honestly) vs. also
      deploying the Node API (see §5 alternative).
- [ ] **Custom domain (optional, paid):** register via Vercel's domain purchase
      flow only after the user approves the cost (~$10–15/yr typical; quote first).
- [ ] **Git remote:** the deploy flow below imports from GitHub; push the project
      root to a repo first (GitHub connector available).

## 4. Deploy procedure (Vercel) — run only after user approval

1. Confirm with the user: target = Vercel, project name, custom domain or
   default `*.vercel.app`, and that **no environment variables are needed**.
2. Push `~/workspace/n8n-clone/` to a GitHub repository (GitHub connector).
3. Create the Vercel project from that repo (Vercel connector `create_deployment`
   or project import). Settings: Framework Preset = **Other**, Build Command =
   empty, Output Directory = `source` (already set in `vercel.json`).
4. Wait for the build to succeed; note the returned deployment URL.
5. Open the live URL yourself and run the verification checklist (§6).
6. If a custom domain was approved: add it in Vercel project settings, confirm
   DNS, and re-run the checklist on the domain.
7. Report the verified live URL to the user. Never report a URL that was not
   opened and checked.

## 5. Alternative targets

### 5a. Node API on Render (free tier) — for working lead capture
`npm start` serves `source/` + the API on `$PORT` (Render injects `PORT`).
No code changes needed; zero npm dependencies.
Caveats: free web services spin down after ~15 min of inactivity (cold start
~30–60 s on first hit); the filesystem is ephemeral, so the JSONL submission
store is lost on restart/redeploy — a persistent disk is a paid add-on, or
point the backend at a real database (see §7). Check current limits at
https://render.com/pricing.

### 5b. Other static hosts
Cloudflare Pages, Netlify, or GitHub Pages all serve `source/` as-is for free.
Same static-only behavior as Vercel §2. Use `vercel.json` only on Vercel;
the other hosts need their own header config if security headers are wanted.

### 5c. Database / backend phase (optional, future)
Run `source/db/migrations/001..006` on PostgreSQL 15+, configure per
`source/db/.env.example`. Free-tier options: Neon or Supabase (both have free
tiers with storage/row caps — see their pricing pages). Note: the current
`api/server.js` does **not** read `DB_*` variables yet — it only honors `PORT`
and uses the JSONL store. Wiring the API to PostgreSQL is a future backend
phase, not part of this deploy.

## 6. Post-deploy verification checklist (fill in after deployment)

- [ ] `GET /` → 200, homepage renders
- [ ] `/pricing/` → 200, cost calculator toggles monthly/yearly
- [ ] `/workflows/` → 200, catalog loads from `data/templates.json`
- [ ] `/integrations/` → 200, catalog loads from `data/integrations.json`
- [ ] `/integrations/slack/` → 200, detail page renders
- [ ] `/features/`, `/docs/`, `/community/`, `/contact/`, `/legal/` → 200
- [ ] `/sitemap.xml` and `/robots.txt` → 200, correct content-type
- [ ] Response headers include `content-security-policy` and `x-frame-options`
- [ ] Form submit (e.g. newsletter) shows the honest "could not reach our
      server" message (static target) — no fake success
- [ ] Desktop and mobile widths render correctly (spot-check)

**Live URL:** _<to be filled after approved deployment>_
**Verified by:** _<name/date>_

## 7. Environment variables

| Variable | Required for static deploy | Required for Node API | Source |
|---|---|---|---|
| `PORT` | No | Yes (host injects it) | `.env.example` |
| `DB_*`, `IP_HMAC_KEY`, `FORM_RETENTION_DAYS` | No | No (future phase) | `source/db/.env.example` |
| `SITE_URL` | Documentation only | Documentation only | `.env.example` |

No secrets exist in this project. The `.hmac-secret` file is generated at
runtime by `api/server.js` (mode 0600) and must never be committed.

## 8. Paid requirements disclosure

- **This deploy plan is fully free:** Vercel Hobby static hosting costs nothing.
- **Optional paid items (all require separate user approval):**
  - Custom domain registration (~$10–15/yr typical; always get a quote first —
    Vercel domain purchases are non-refundable).
  - Vercel Pro/Team if the project outgrows Hobby limits or needs team features.
  - Render persistent disk or paid instance type if the Node API needs durable
    local storage / always-on behavior.
  - Managed PostgreSQL beyond free-tier caps (Neon/Supabase) for the backend phase.

## 9. Rollback

Vercel keeps every deployment; rollback = promote the previous deployment in
the Vercel dashboard or redeploy the prior Git commit. Static-only deploy has
no database state to unwind. For the Render API path, rollback = redeploy the
previous commit; note JSONL submissions on the ephemeral disk are lost on any
redeploy regardless.

## 10. Limitations

- Nothing has been deployed; the live URL and verification checklist in §6 are
  blank by design and must only be filled after an approved, verified deploy.
- The Vercel connector connection was not exercised in this prep run; the
  procedure in §4 assumes the connector is healthy at deploy time.
- Exact third-party free-tier numbers change; links to current pricing pages
  are given instead of hard figures.
- `api/server.js` has no PostgreSQL wiring yet (§5c) — the README's "point the
  API at the database" step is aspirational in the current code.
- Screenshots of the deployed site were not taken; visual checks are part of
  the post-deploy checklist.
