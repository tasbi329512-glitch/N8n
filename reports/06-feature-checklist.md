# n8n-clone — Feature Parity Checklist (Parity Agent, attempt 2, 2026-10-17)

Source: `/home/hatch/workspace/n8n-clone/source`
Reference: `/home/hatch/workspace/research_notes/n8n-clone/FEATURE_INVENTORY.md`
Previous attempt: attempt-1 checklist reported 4 defects (D1–D4). **All four verified
fixed in this attempt.**

Method: static content audit of all 9 pages + `data/*.json` + CSS/JS, cross-checked
against Agent 7's test report (`reports/test_report.md`) and the 09:51 attempt-1 checklist.
⚠️ No live browser in this environment: visual rendering, real click/keyboard
interaction, scroll reveals, and responsive layout were verified **by code inspection
only**, never by actual rendering. Items are marked "code-verified", not "render-verified".

Brand note: original branding ("Flowmint"), original SVG/CSS artwork, paraphrased copy —
per scope (original code + original branding, no lifted assets). Testimonials, case
studies, and the GitHub star pill are fictional/illustrative placeholders (labeled as
such on-page). No real-company endorsement claims.

## F1 — Global chrome — ✅ ALL PASS
- F1.1 ✅ Fixed floating header: `.ds-header` position fixed, pill bar, `backdrop-filter`
  blur(16px), hide-on-scroll via `ds-header--hidden` — all 9 pages, code-verified.
- F1.2 ✅ Original wordmark-style logo (`assets/logo.svg`), consistent placement/scale.
- F1.3 ✅ Center nav: Product ▾, Use cases ▾, Docs ▾, Community ▾, Enterprise, Pricing.
- F1.4 ✅ Four dropdown panels (5/6/4/5 links), chevron toggle buttons with
  `aria-expanded`, label click navigates.
- F1.5 ✅ Header right: GitHub star-count pill (48k, labeled illustrative), Sign in
  (auth modal), gradient Get Started pill.
- F1.6 ✅ Mobile: hamburger → slide-in drawer with accordion submenus + mobile CTAs.
- F1.7 ✅ Footer: dark rounded card; brand column (logo, tagline, newsletter form,
  5 social icons as labeled placeholders); 3 link columns; bottom bar
  (Security | Privacy | Report a vulnerability; copyright line).

## F2 — Homepage sections — ✅ ALL PASS (12/12, reference order)
- F2.1 ✅ Hero (dark): eyebrow, H1, subcopy, 2 CTAs, original SVG artwork (node graph
  + pink-purple-blue glow spirit; CSS/SVG originals, no lifted assets).
- F2.2 ✅ Use-case tab showcase: 5 tabs, gradient accent bar on active
  (`.ds-tab[aria-selected="true"]::before`), workflow-canvas visuals per tab via
  `data-tab-canvas` render spec.
- F2.3 ✅ Social proof strip: 3 stats (140k+ builders, 2.4B executions, 4.8/5).
- F2.4 ✅ Logo marquee: 12 original grayscale text wordmarks, duplicated track,
  infinite CSS animation.
- F2.5 ✅ Integrations band (light): H2, browse link, 6 integration tiles.
- F2.6 ✅ Feature trio: "AI without the black box" / "Deploy wherever you decide" /
  "Humans stay in the loop" (paraphrased equivalents of unboxed AI / deploy anywhere /
  human-in-the-loop).
- F2.7 ✅ Alternating band: "Visual when you want it, code when you need it" + visual.
- F2.8 ✅ Alternating band: "Ship fast without breaking things" + debug visual.
- F2.9 ✅ Case studies: 2 fictional cards (Meridian Grocers, Atlas Freight) with metric
  + quote + CTA, labeled fictional — per scope.
- F2.10 ✅ Enterprise band: H2 + 2 CTAs + 4 sub-columns.
- F2.11 ✅ Testimonial marquee: 10 quotes with handles, infinite scroll.
- F2.12 ✅ Final CTA: gradient panel, H2, button.

## F3 — Pricing page (`/pricing/`) — ✅ ALL PASS (D1, D2 verified fixed)
- F3.1 ✅ H1 + monthly/annual toggle, annual default, "Save ~17% with annual billing" hint.
- F3.2 ✅ 4 plan cards: Starter €20 / Pro €50 / Business €667 / Enterprise custom (annual);
  monthly €24/€60/€800; execution quotas (2.5k/10k/40k/Custom); Pro/Business expandable
  details. (D1 fixed: `currencySymbol: "€"`, markup renders €20/€50/€667.)
- F3.3 ✅ "Pay for full executions" explainer banner.
- F3.4 ✅ "Looking for something else?" row: Start-up plan + Community Edition cards.
- F3.5 ✅ "What's included?" comparison table: Cloud/Core edition tabs, 4 grouped row
  groups, 4 plan columns.
- F3.6 ✅ FAQ accordion, data-driven: **20 Q&As** in `data/faq.json`. (D2 fixed.)
- F3.7 ✅ Testimonials + final CTA + footer.

## F4 — Templates page (`/workflows/`) — ✅ ALL PASS
- F4.1 ✅ Header w/ template count (28), search input, category pills.
- F4.2 ✅ All sections: Newcomer essentials, Trending AI, Browse by category, Featured,
  Recently added.
- F4.3 ✅ Template cards rendered from `data/templates.json` (search/filter/empty-state/
  load-more wired); "What's in your stack?" band; Verified creators; CTA.

## F5 — Integrations page (`/integrations/`) — ✅ ALL PASS (D3 verified fixed)
- F5.1 ✅ Header w/ integration count (36), search, type filters, category sidebar.
- F5.2 ✅ 3-column card grid + "Load more"; logo strip; **testimonials section**
  ("What integrators say", `ds-quote` cards) — D3 fixed; final CTA.

## F6 — Features page (`/features/`) — ✅ ALL PASS
- F6.1 ✅ Hero + anchor-nav pills (Visual building, AI that ships, Use cases,
  Debug & monitor, Deploy your way, Enterprise) with matching target ids; sections:
  visual building, AI that ships, use-cases, debug & monitor, deploy/self-host,
  enterprise; testimonials; final CTA.

## F7 — Cross-cutting — ✅ ALL PASS (code-verified)
- F7.1 ✅ Responsive: 48rem/64rem/80rem breakpoints + max-width mobile rules (cover
  390px); 12-col grid → 1-col mobile on trio/cases; dark/light band rhythm preserved.
- F7.2 ✅ Motion: scroll reveals (`.ds-reveal`), marquee loops, tab transitions,
  accordion animation, hover lifts; all gated behind `prefers-reduced-motion`.
- F7.3 ✅ SEO: unique `<title>` + meta description + OG tags per page, semantic HTML
  (one `<h1>` per page, skip link, semantic `<table>`), `sitemap.xml`, `robots.txt`.
- F7.4 ✅ No lifted assets: Manrope via Google Fonts (OFL); all visuals CSS/SVG
  originals; all 18 referenced icon ids defined in `assets/icons/icons.svg`
  (18 referenced / 19 defined, zero missing — independently verified).

## Attempt-1 defect verification (all resolved)
- **D1 — currency symbol**: `data/pricing.json` now uses `currencySymbol: "€"`; markup
  shows €20/€50/€667. ✅ Fixed.
- **D2 — FAQ count**: `data/faq.json` now contains **20** Q&As. ✅ Fixed.
- **D3 — integrations testimonials**: `/integrations/` now includes a testimonial strip
  ("What integrators say", `ds-quote` cards). ✅ Fixed.
- **D4 — search "undefined" bug**: `js/data.js` `matches()` now filters out null fields
  before joining the haystack. ✅ Fixed.

## Explicitly NOT verified (not defects — tooling limitation)
- Actual visual rendering of any page (no browser in this environment).
- Real click/keyboard interaction, dropdown/drawer/modal behavior, scroll reveals.
- Responsive layout at physical device widths; no Lighthouse/a11y audit run.
- PostgreSQL migrations never executed (static site; front-end-only demo stubs by design).
- External link liveness (discord.com, github.com, fonts.googleapis.com).

## Verdict
**PASS** — All 7 feature groups verified present (code-verified). Attempt-1's four
defects (D1 currency, D2 FAQ count, D3 integration testimonials, D4 search bug) are all
confirmed fixed. No remaining defects. Test report's noted failures were root-caused to
test fixtures, not source. No structural or scope-level gaps.
