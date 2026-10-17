# n8n-clone QA Test Report — Testing Agent (attempt 2)

**Project:** n8n-clone ("Flowmint" static marketing-site replica)
**Source:** `/home/hatch/workspace/n8n-clone/source`
**Date:** 2026-10-17 · **Result: PASS — no source bugs found**

## Commands run

| # | Command | Result |
|---|---------|--------|
| 1 | `node --check js/main.js && node --check js/components.js && node --check js/data.js` | PASS (all 3 files) |
| 2 | `python3 <workdir>/smoke.py` (project's own suite: a11y/SEO basics, link audit, brand-originality scan, JSON fetch targets, CSS presence) | ALL CHECKS PASSED (~95 checks) |
| 3 | `node verify_tpl.cjs` (templates catalog search behavior) | PASS — `"define"` → 0 of 28, `""` → 28 of 28 |
| 4 | `node verify_d1.cjs` (billing toggle paints € from real pricing.json) | PASS — annual €20/€50/€667/Custom, monthly €24/€60/€800/Custom |
| 5 | `node verify_d4.cjs` (integrations search regression) | PASS — `"slack"` → 1 of 36, no false positives |
| 6 | `node jsload.cjs` (JS load-time runtime errors) | PASS — all 3 files load clean |
| 7 | `node interact.cjs` (tabs, canvas, pricing toggle, catalog) | 11/13 — 2 failures investigated and cleared (see Findings) |
| 8 | `python3 <workdir>/deep_qa.py` (new live-server suite) | 99/99 PASS |
| 9 | `node interact2.cjs` (new accordion + auth-modal suite) | 5/5 PASS |

## What was validated

- **Pages & SEO/a11y basics** (9 pages): single `<h1>`, `<title>` + meta description, skip link + `<main id="main">` landmark, footer present, no unreplaced `{{PAGE_…}}` placeholders.
- **Navigation**: every internal href in all 9 pages live-resolves to HTTP 200 via a local `http.server`; all same-page anchors resolve; sitemap URLs match the page set; robots.txt serves.
- **Forms & validation**: all forms carry `data-stub-form`; every required/email/minlength input carries `data-validate`, and every token used in markup (`required`, `email`, `min8`) is handled by `validateForm` in `main.js`. Email regex edge cases tested (`a@b.co` ✓, `a@b.c` ✗, `x@y` ✗, `a@@b.co` ✗). Submit flow shows clearly-labeled demo success states with `role="status"`; validation failure focuses the first invalid field.
- **Pricing**: toggle flips annual↔monthly with correct € values and `aria-checked`; save-hint updates; comparison-table tabs render per-edition cells matching plan columns; fetch-failure fallback disables the toggle and keeps server-rendered prices.
- **Catalogs**: integrations + templates render 12-card first pages, category pills, working search (debounced), filters, load-more, and counts.
- **Accordion**: FAQ renders from `faq.json` with unique `btnId`/`panelId` pairs, single-open behavior within `data-accordion-scope`, `aria-expanded` toggling; error fallback message on fetch failure.
- **Auth modal**: opens from `[data-auth-open]`, defaults to signup tab with signin hidden, closes via backdrop/close button.
- **Assets**: all 4 CSS files load (brace-balanced); all 19 `icons.svg#i-*` fragment references resolve to defined `<symbol>` ids; all 4 `data/*.json` files serve and parse as valid JSON.
- **Error handling**: all six fetch chains (`pricing`, `compare`, `faq`, `integrations`, `templates`, showcase tiles) have `.catch` fallbacks that leave static HTML content or show a friendly message — no unhandled rejections in the tested paths.
- **Brand originality**: no reference-brand words or reference URLs/assets in visible copy (project's smoke check).

## Bugs

**None found in the application source.** Two anomalies surfaced during testing; both were root-caused to test fixtures, not source code:

1. `interact.cjs`: "toggle flips to monthly prices — €24" and "toggle flips back to annual" FAILED. Investigation: the interaction stub's fixture hard-codes expectations in `$` (`'$24'`), while the real `data/pricing.json` uses `currencySymbol: "€"` and the server-rendered markup shows `€20/€50/€667`. The actual painted value was the correct `€24`. `verify_d1.cjs` (written against real data) passes. → Test-fixture artifact, source correct.
2. My `deep_qa.py` initially flagged `<use>` icon refs and internal asset links; investigation showed both were bugs in my own test script (regex missed external-fragment refs; path handling appended a stray `/`). Fixed and re-run: 99/99 PASS. All 19 used icon ids are defined in `icons.svg`.

## Limitations — what could not be inspected and why

- **Visual rendering**: no headless browser (chromium) or jsdom is installed in this environment, so actual rendered layout, CSS cascade results, responsive breakpoints, animations, and `prefers-reduced-motion` behavior were not visually verified — only statically (brace/tag balance, token presence).
- **Real user interaction**: keyboard-only navigation order, focus-ring visibility, screen-reader announcements, and touch gestures were not tested; ARIA wiring was verified at the markup/attribute level only.
- **Live-backend behavior**: forms are front-end-only demo stubs by design (README documents this); no submission endpoint exists to test. The `db/` PostgreSQL schema/migrations were not executed — PostgreSQL is not installed in this environment.
- **Cross-browser/compatibility**: testing was done with Node 24 + Python stdlib only; behavior in Safari/Firefox/older browsers was not checked.
- **Performance**: no Lighthouse, bundle-size, or paint-timing measurements were taken.
- **External links**: outbound links (discord.com, github.com, x.com, linkedin, youtube) were inventoried but not fetched; their destinations were not verified.
- **`file://` usage**: README notes `fetch()` of `data/*.json` requires http(s); the fetch-failure fallbacks were code-reviewed and stub-tested but not exercised in a real `file://` browser session.
