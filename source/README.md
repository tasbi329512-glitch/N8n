# Flowmint — marketing site

Static marketing-site replica of a workflow-automation platform, built
clean-room from the REPLICA AI recon/analysis chain (see `../reports/`).
**All code, copy, artwork, and branding are original.** Nothing was lifted
from the reference site: no markup, class names, styles, scripts, images,
logos, fonts, or copy text.

## Brand originality statement

- Brand name **Flowmint**, the node-flow SVG wordmark (`assets/logo.svg`),
  and every headline, paragraph, testimonial, case study, and FAQ answer
  were written fresh for this replica.
- Customer logos in the marquee are fictional text marks
  (HELIX, Nordlys, KODA, …). Case studies (Meridian Grocers, Atlas Freight)
  and all testimonials/quotes/handles are fictional and labeled as such
  on-page.
- Social-icon links and the GitHub star pill were documented placeholders;
  the repair pass (2026-10-17) **removed** them rather than ship misleading
  trust signals. Homepage stat figures are labeled illustrative on-page.
- Design *token values* (hex colors, sizes, breakpoints) are measured facts
  reused from analysis; every selector and declaration is freshly authored.
- Font substitution (documented): the reference uses proprietary Geomanist;
  this replica uses **Manrope** (SIL Open Font License).

## Demo data

- `data/pricing.json`: public list prices mirrored from the reference's
  published pricing (EUR; monthly figures follow the reference's public
  +~20% monthly pattern — re-verify before production use).
- `data/faq.json`, `data/templates.json`, `data/integrations.json`:
  curated original datasets written for this replica (60 integrations,
  48 templates — a curated starter catalog, labeled as such on-page).
  Per-item detail pages (`/integrations/<key>/`, `/workflows/<key>/`)
  are generated from these datasets with `npm run build:details`.
- Forms (newsletter, contact, signup, signin, waitlist,
  request-integration) POST to the real lead-capture endpoint
  `POST /api/forms` (see "Backend API" below). Success copy promises only
  what the endpoint does — record the submission. If the API is
  unreachable (pure static hosting), the form says so plainly instead of
  faking success.
- `db/` holds the PostgreSQL schema + migrations. The zero-dependency API
  server (`api/server.js`) mirrors the `form_submissions`/`consents`
  tables in an append-only JSONL store; on a PostgreSQL deployment run
  `db/migrations/001..006` and point the API at the database.

## Project layout

```
project-root/
├── source/               the deployable site (serve this statically, or via npm start)
│   ├── index.html            homepage
│   ├── pricing/              pricing page (+ executions/month cost calculator)
│   ├── workflows/            template catalog (+ 48 per-template detail pages)
│   ├── integrations/         integration catalog (+ 60 per-integration detail pages)
│   ├── features/             features page
│   ├── docs/                 docs landing
│   ├── community/            community landing
│   ├── contact/              contact / talk-to-sales form
│   ├── legal/                privacy, security, license, imprint, …
│   ├── css/                  tokens.css, base.css, components.css, effects.css
│   ├── js/                   main.js, components.js, data.js, calculator.js
│   ├── data/                 pricing.json, faq.json, templates.json, integrations.json
│   ├── assets/               logo.svg, icons/icons.svg (original SVG set)
│   ├── db/                   PostgreSQL schema + migrations (canonical store)
│   ├── sitemap.xml, robots.txt
│   └── README.md
├── api/
│   └── server.js         zero-dependency Node server: static hosting +
│                         real lead-capture API (POST /api/forms)
├── scripts/
│   ├── generate-detail-pages.js   builds the 108 per-item detail pages
│   └── smoke.js                   npm test — full repair-pass verification
└── package.json
```

Shared header/footer chrome is assembled from `chrome/head.html` +
`chrome/foot.html` with per-page bodies in `pages/` via
`assemble.py` (workflow work dir). The served files are fully standalone —
no build step is needed to deploy; serve `source/` as static files.

## Backend API (lead capture)

Zero-dependency Node server — no `npm install` needed:

```bash
npm start                 # serves source/ + API on http://localhost:3000
PORT=4000 npm start       # custom port
```

- `POST /api/forms` — accepts
  `{ "form": "signup|signin|contact|newsletter|waitlist|request-integration",
     "payload": { ...allowlisted fields... } }`.
  Validates per-form field allowlists (unknown fields rejected, email
  format checked, length caps), rate-limits (30/10 min per client), and
  appends to `api/data/form_submissions.jsonl` with the same columns as
  `db/schema.sql` (`id, form, payload, email, consent_marketing, ip_hash,
  user_agent, created_at`). Newsletter/waitlist also append a consent row
  to `api/data/consents.jsonl`. Raw IPs are never stored — only an
  HMAC-SHA256 hash used for abuse-rate math. Passwords are never accepted
  or stored: this build has no account system, so auth forms collect
  name/email only.
- `GET /api/health` — `{"ok":true}`.
- Static hosting without Node still works: pages render and catalogs load,
  but form submits show an honest "could not reach our server" error
  instead of fake success.

## Local preview

```bash
npm start
# open http://localhost:3000/
```

Note: `file://` browsing works for layout, but `fetch()` of `data/*.json`
requires http(s) — catalog pages, pricing toggle, and FAQ need the local
server.

## Checks

```bash
npm test                  # node scripts/smoke.js — syntax, data, detail
                          # pages, honest-copy scan, trust-signal scan,
                          # sitemap coverage, form↔API wiring, live API
                          # round-trip (health, valid/invalid submits)
npm run build:details     # regenerate the 108 per-item detail pages
```

## Accessibility notes (improvements over the reference)

Skip link, `<main>` landmark, real `<h1>` per page, semantic `<table>` for
the pricing comparison, `prefers-reduced-motion` support, keyboard-operable
dropdowns/tabs/accordions/drawer, visible focus rings, `inert` mobile drawer.
