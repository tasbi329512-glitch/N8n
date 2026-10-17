# REPLICA AI · n8n-clone — Testing Agent Report (Agent 7, attempt 1)

**Date:** 2026-10-17 · **Source:** `/home/hatch/workspace/n8n-clone/source`
**Verdict: PASSED** — 1 low-severity bug found (search false-positives), everything else verified.

## Commands run

1. `node --check js/main.js js/data.js js/components.js` — all 3 pass (project's own check from README).
2. `python3 <workdir>/smoke.py` — the project's own smoke test (link audit, a11y basics, brand-originality scan): **ALL CHECKS PASSED**.
3. `python3 -m http.server` + curl — all 9 pages, 4 JSON datasets, JS, CSS, logo, and icon sprite return **HTTP 200**.
4. Custom Node harnesses executing the **real** `main.js`, `data.js`, `components.js` against the real JSON data with a DOM stub:
   - Form validation: 7/7 cases pass (required, email, min8, whitespace-only, optional-empty, padded email); correct error text + `aria-invalid`.
   - Submit flow: valid stub form → `preventDefault` + success state; invalid → blocked with field error; non-stub forms ignored; live error-clear on input works; Escape handler no-throw.
   - Catalog: initial 12-card render, "36 of 36" count, 9 category pills, search filter narrows correctly, no-match shows empty state, load-more paginates to 24 with correct button label.
   - Pricing toggle: annual default ($20/$50/Custom) → monthly ($24/$60) on toggle → back to annual; `aria-checked` flips.
5. Static audits: 372 internal href/src refs resolve (0 broken); all 19 referenced SVG icon ids defined; all `aria-controls` targets exist; exactly 1 `<h1>` per page; all images have `alt`; all inputs have `<label>`/`aria-label`; CSS braces balanced; comparison-table cell counts match plan count for both editions; `data-*` JS hooks present on every page (header, drawer, auth modal, tabs, canvas, pricing, compare, FAQ, catalogs).

## Bugs

1. **[LOW] Search matches "undefined" in catalog filters** — `js/data.js` `matches()` builds its search haystack as `item.name + ' ' + item.title + ' ' + item.description + ' ' + item.blurb + ' ' + item.category`, but `title`/`description` don't exist on integrations and `blurb` doesn't exist on templates, so the literal string "undefined" enters the haystack. Verified against real data: a query of "define" (or "undefined") matches **all 36 integrations and all 28 templates** regardless of relevance. Fix: build the haystack only from fields present per kind, e.g. `(item.name + ' ' + (item.title||'') + ' ' + (item.description||'') + ' ' + (item.blurb||'') + ' ' + item.category)`. File: `js/data.js`, `matches()`.

## Notes (by design, not bugs)

- All forms (newsletter, contact, signup/signin, waitlist) are front-end demo stubs — validation works, success states render, and each is clearly labeled on-page "Demo note: nothing was sent". No backend exists (README documents `db/` as unused by the static site).
- Case studies, testimonials, and the GitHub star pill are documented fictional/illustrative placeholders.

## Limitations

- **No live-browser testing possible**: this agent has no browser control, so visual rendering, real click/keyboard interaction, scroll reveals, dropdown/drawer/modal behavior, and responsive layout were verified only by code inspection and DOM-stub harnesses, not by actual rendering.
- **PostgreSQL migrations not executed**: `db/migrations/*.sql` target PostgreSQL 15+; only sqlite3 is installed here, so SQL syntax was not validated. The README itself notes the migrations were authored but never executed and are unused by the static site.
- **No screen-reader or real keyboard testing**: ARIA attributes and keyboard handlers were inspected statically (all `aria-controls` resolve, labels present), but not tested with assistive technology.
- **No performance/accessibility audits**: no Lighthouse or equivalent run in this environment.
- External links (discord.com, github.com, fonts.googleapis.com, etc.) were not fetched for liveness.
