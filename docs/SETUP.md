# Flowmint Setup Guide

Deploy or run the Flowmint marketing site locally. Everything below was
verified 2026-10-17 with `npm test` (full smoke suite: syntax, data, detail
pages, honest-copy scan, trust-signal scan, sitemap coverage, form↔API wiring,
live API round-trip).

## Requirements

- Node.js ≥ 18 (zero dependencies — no `npm install` needed)
- PostgreSQL (optional; only for the backend/CMS phase)

## Option A — static hosting (simplest)

Serve `source/` as static files with any static host (nginx, Netlify, Vercel,
S3, GitHub Pages…):

```
your-host → /path/to/flowmint-site/source/   (the project root's `source/` dir)
```

- All 117 pages render standalone; no build step required.
- `data/*.json` catalogs, the pricing toggle, and FAQ need http(s) —
  `file://` browsing breaks `fetch()`.
- Forms will show an honest "could not reach our server" error (by design).

## Option B — local preview with the lead-capture API

```bash
npm start                 # http://localhost:3000
PORT=4000 npm start       # custom port
```

The zero-dependency Node server (`api/server.js`) serves `source/` **and**
the real form endpoint:

| Endpoint | Behavior |
|---|---|
| `POST /api/forms` | Records signup/signin/contact/newsletter/waitlist/request-integration submissions. Validates per-form field allowlists, rejects unknown fields (including passwords), checks email format, rate-limits 30 req/10 min per client. Appends to `api/data/form_submissions.jsonl` (+ `consents.jsonl` for newsletter/waitlist). Stores an HMAC-SHA256 hash of the IP only — never raw IPs. |
| `GET /api/health` | `{"ok":true}` |

No account system exists in this build: auth forms collect name/email only.

## Option C — PostgreSQL backend (optional CMS phase)

The database is **optional**. The shipped site is static; `db/` is there for
the optional backend phase. To use it:

1. Copy and fill the example config:
   ```bash
   cp source/db/.env.example .env   # fill DB_*, keys, passwords
   ```
   Use `openssl rand -base64 48` to generate `SESSION_SIGNING_KEY` and
   `IP_HMAC_KEY`. Never commit `.env`.
2. Run migrations in order:
   ```bash
   psql $DATABASE_URL -f source/db/migrations/001_extensions_helpers.sql
   # ... 002 through 006
   ```
   Or review `source/db/schema.sql` (full snapshot) and run migrations instead
   for a fresh install — they are equivalent.
3. Point the API at the database. Default remains the append-only JSONL store
   (`api/data/`), which mirrors the `form_submissions`/`consents` columns.
4. Retention: form submissions auto-purge after `FORM_RETENTION_DAYS`
   (default 365). See `reports/agent03-database.md` § Security for details.

## Verifying a build

```bash
npm test                 # node scripts/smoke.js — the full verification suite
npm run build:details    # regenerate the 108 per-item detail pages
                         # (run after editing data/*.json)
```

What `npm test` covers: JS/CSS syntax, dataset integrity, all 108 detail
pages exist and match data, honest-copy scan (no fake success claims), no
misleading trust signals, sitemap covers all URLs, every `data-lead-form`
kind is accepted by the API, live server boot + health + form round-trips
(valid/invalid submits, rate-limit fields, no raw IP storage).

## Project layout (recap)

```
source/        deployable site (HTML pages, css/, js/, data/, assets/, db/, sitemap.xml, robots.txt)
api/           zero-dependency Node server (static + POST /api/forms)
scripts/       generate-detail-pages.js, smoke.js
design-system/ design-token working copies
docs/          this documentation (BRAND_KIT.md, USER_GUIDE.md, SETUP.md, LAUNCH.md)
reports/       internal analysis reports (recon/analysis of the reference; not shipped)
```

## Environment checklist before going live

- [ ] Domain + TLS in front of the server (or static host)
- [ ] `PORT` / reverse proxy configured; health check on `GET /api/health`
- [ ] If using the JSONL store: persistent volume for `api/data/`
- [ ] If using PostgreSQL: `.env` filled, migrations applied, backups on
- [ ] Re-verify pricing figures (`data/pricing.json`) against current public prices
- [ ] Replace fictional testimonials/case studies with real ones or keep the
      on-page "fictional" labels
- [ ] Run `npm test` — must end with `SMOKE OK`
