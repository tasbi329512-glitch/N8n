# REPLICA AI · n8n-clone — QA Test Report (Agent 7, product pass)
**Date:** 2026-10-17 · **Project:** Flowmint marketing site + lead-capture API (`/home/hatch/workspace/n8n-clone/`)
**Scope:** static site `source/` (117 pages), zero-dependency Node API `api/server.js`, SQL migrations in `source/db/`

## Verdict: PASS

All automated and manual checks passed. No blocking bugs found. One minor
cosmetic risk noted below (not a failure).

## 1. Project's own test suite — `npm test` (scripts/smoke.js)
Ran `npm test` first. Result: **SMOKE OK** — all sections green:
boot & static serving, catalog data (60 integrations / 48 templates /
4 pricing plans), 108 detail pages with unique SEO titles, no stub residue,
honest copy, trust-signal removal verified, sitemap covers all detail URLs,
form wiring (6 accepted form kinds), and 15 live-API checks
(health, static serving, valid POSTs, 422/404/413 rejections, JSONL
persistence, no raw IP storage, consent rows).

## 2. Static checks (run by Agent 7)
- `node --check` on all 6 JS files (`js/main.js`, `components.js`,
  `data.js`, `calculator.js`, `api/server.js`, `scripts/*.js`): **pass**.
- All 4 `data/*.json` files parse as valid JSON: **pass**.
- **Internal link check** (custom crawler over all 117 HTML pages,
  `href`/`src`/`action`, honoring root-absolute paths, query strings and
  directory indexes): 0 broken internal links, 0 missing assets
  (CSS, JS, SVG, JSON). 140 same-page `#anchor` targets verified,
  0 misses. No duplicate `id`s on any page.
- Sitemap: 117 `<loc>` entries, all resolve to a real `index.html`. **pass**.
- Catalog integrity: every per-item detail directory (`integrations/<key>/`,
  `workflows/<key>/`) has a matching key in the JSON datasets. 0 orphans.
- HTML hygiene: no `lorem ipsum`, `TODO`, `FIXME` anywhere; all 351 `<img>`
  tags have `alt`; CSS brace counts balanced in all 4 stylesheets.
- Copy honesty spot-check: sign-in modal copy explicitly states
  "Live accounts are not open yet" and submits email-only — no fake
  account creation; matches the API rejecting unknown fields.

## 3. Live HTTP tests (API server on localhost:8931, real request/response)
- 117/117 pages return **200** with `text/html` over HTTP.
- Assets: `/css/*.css` (correct content-type), `/js/main.js`,
  `/assets/logo.svg`, `/robots.txt`, `/sitemap.xml`, `/data/*.json`: all 200.
- `/api/health` → 200 `{"ok":true}`.
- Missing page → 404; `GET /api/forms` → 404 (no read path);
  `PUT`/`DELETE /api/forms` and `POST /api/health` → 405; path-traversal
  request blocked (no `/etc/passwd` content).
- All 6 form kinds POST valid payloads → 200 `{"ok":true}` with UUID ids.
- Error handling: invalid email → 422; missing required fields → 422;
  unknown form → 422; unknown field (`password`) → 422; invalid `topic`
  enum → 422; script-like email → 422; malformed JSON → 400; 40 KB
  oversized body → 413.
- **Rate limiting verified live:** after the 30-request/10-min window was
  exceeded, further POSTs returned **429**, and the client-side form code
  (`main.js`) shows an honest "Slow down… nothing was saved" state for 429.
- Persistence: submissions appended to `api/data/form_submissions.jsonl`
  mirroring the schema columns; **no raw IP stored** (only HMAC `ip_hash`).
  Test-submission residue was removed afterward; the store was left empty
  (clean initial state).

## 4. Form + calculator logic review
- Form field names in the HTML (`newsletter`, `signup`, `signin`, `contact`,
  `waitlist`, `request-integration`) exactly match the server allowlists;
  client validation rules (`required`, `email`, `min8`) match server rules;
  contact `topic` `<option>` values match the server `TOPICS` enum.
- Pricing calculator: `calculator.js` correctly parses `pricing.json`
  (`annual.price`, quota strings like "2.5k executions / mo", `custom` flag);
  all 4 plans verified (starter 2.5k / pro 10k / business 40k /
  enterprise custom); 7 slider stops map to real quota boundaries;
  currency symbol `€` read from `meta.currencySymbol`. Escapes output
  (`esc()`) before `innerHTML` — no XSS vector.
- Catalog renderer (`data.js`): all field accesses (`name`, `category`,
  `type`, `difficulty`, `creator`, `blurb`, …) exist in the datasets; output
  HTML-escaped; letter-glyph tiles used instead of third-party logos.

## Bugs found
None that affect function. One minor cosmetic risk (not counted as a bug):
- In `calculator.js` `fmt()`, volumes between stops display rounded labels
  (e.g. slider has 7 discrete stops) — the control is deliberately discrete,
  so this is by design, not a defect.

## Commands run
- `npm test` (node scripts/smoke.js) — pass
- `node --check` on all JS; JSON parse of all data files — pass
- Custom link crawler (`qa/linkcheck.js`) over 117 pages — 0 broken
- Same-page anchor checker (`qa/anchorcheck.js`) — 0 misses
- Live HTTP suite (`qa/httptest.js`, 28 assertions) against
  `node api/server.js` on port 8931 — 27 pass + 1 transient harness socket
  error on `DELETE /api/forms`, re-verified manually: server returns 405
  correctly (curl + node both confirm)
- Rate-limit probe (25 rapid POSTs) — 429 after window exceeded, correct
- Sitemap/page consistency, catalog/dataset key cross-check, `<img alt>`
  audit, duplicate-id audit, CSS brace balance, copy-hygiene grep
- Server started with `PORT=8931 node api/server.js`, stopped after tests;
  QA test rows removed from `api/data/*.jsonl` (store left empty)

## Limitations
- **No real browser was available** (subagent cannot operate the live
  browser): client-side rendering (calculator slider interaction, catalog
  search/filter/pagination, auth modal open/close, scroll reveals, form
  submit UX end-to-end, 12 s timeout copy, mobile layouts, responsive
  breakpoints) was verified only by code review + static markup presence,
  not by visual or DOM-interactive execution.
- **PostgreSQL migrations not executed**: `psql` is not installed on the VM,
  so `source/db/*.sql` (schema + 6 migrations) could not be applied or
  functionally tested. Verified by review only (JSONL store mirrors the
  schema columns, as smoke.js asserts). A real PostgreSQL deployment still
  needs a migration dry-run.
- **Only Google-fonts CDN** is external; no other third-party dependencies
  were fetched or tested. Fonts render could not be visually confirmed.
- Accessibility: structural checks only (alt text, aria attributes present
  in form code); no screen-reader or keyboard-only walkthrough performed.
