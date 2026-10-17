# REPLICA AI — Architecture Design (n8n-clone)

Date: 2026-10-17 · Agent 2 (Architecture Agent) · Project: n8n-clone
Inputs: recon pack `~/workspace/research_notes/n8n-clone/` (report.md, FEATURE_INVENTORY.md,
DESIGN_TOKENS.md, 3 screenshots, source dumps), agent12 HTML/CSS analysis,
agent13 JS/interaction analysis (`~/workspace/n8n-clone/reports/`).

Scope: the n8n.io **public marketing website only**. The workflow-editor app (app.n8n.cloud),
forum, academy course bodies, blog article bodies, and checkout/account flows are out of scope
(per recon §8, FEATURE_INVENTORY "Explicitly OUT of scope").

All code will be written fresh (clean-room reimplementation). No markup, styles, scripts,
images, logos, fonts, or copy text from the reference will be lifted; design-token *values*
(hex colors, sizes, breakpoints) and page structure are facts reused from analysis.

---

## 1. Technology stack

| Layer | Choice | Rationale |
|---|---|---|
| Pages | Static multi-page HTML (one file per route) | Marketing site; no server logic observed; deployable anywhere |
| Styling | Hand-written CSS, custom-property token layer (mirroring the reference token semantics with our own names) | No build step; full control; token values already extracted by agent12 |
| Scripting | Vanilla ES6, no framework, no bundler | Interactions are toggle/accordion/marquee/filter-class; a framework adds cost without benefit |
| Font | **Manrope** (open-licensed geometric sans, Google Fonts) | Agent12-substituted for proprietary Geomanist; closest open geometric humanist sans |
| Data | Static JSON files (`data/templates.json`, `data/integrations.json`, `data/pricing.json`, `data/faq.json`) fetched client-side | Template/integration search+filter works client-side; no backend needed |
| Tooling | None required. Optional: a tiny Node script for smoke checks | Free, zero-install; fits the "prefer free tooling" rule |
| Deployment | Any static host (GitHub Pages, Vercel static, Replit static, or web artifact) | No server, no env vars, no paid services |

**Deliberately not chosen:** Nuxt 3 / SSR (the reference's stack) — it adds a Node build and
runtime for zero benefit on a static marketing replica; static HTML is simpler, faster, and
cheaper to verify visually. **No database** — nothing on the marketing site stores data;
the pipeline's "database migrations" deliverable is N/A for this project (documented, not
skipped). **No backend APIs** — see §3.

---

## 2. Project structure

```
n8n-clone/
├── index.html                 # homepage (F2 sections in order)
├── pricing/index.html         # /pricing/ (F3)
├── workflows/index.html       # templates page (F4)
├── integrations/index.html    # integrations page (F5)
├── features/index.html        # features page (F6)
├── css/
│   ├── tokens.css             # design tokens: colors, type scale, radius, breakpoints, z-index
│   ├── base.css               # reset, landmarks, skip link, focus styles, reduced-motion
│   └── components.css         # C1–C23 component styles
├── js/
│   ├── main.js                # header (hide-on-scroll, dropdowns, mobile nav), reveal observer, marquees
│   ├── components.js          # tabs, accordions, billing toggle, comparison-table tabs, Load-more, filters
│   └── data.js                # JSON fetch + render helpers for templates/integrations/grids
├── data/
│   ├── templates.json         # curated template cards (titles/descriptions paraphrased)
│   ├── integrations.json      # curated integration cards (original glyphs/text, no lifted logos)
│   ├── pricing.json           # plan data: prices (locale-parameterized), quotas, comparison rows
│   └── faq.json               # ~20 paraphrased Q&As
├── assets/
│   ├── logo.svg               # ORIGINAL wordmark-style mark (not the reference's)
│   ├── icons/                 # ORIGINAL SVG glyphs (social, checks, node-graph art)
│   └── art/                   # ORIGINAL hero/tab visuals (CSS/SVG/canvas, same spirit as reference)
├── data/templates.json        # (see above)
└── README.md                  # build/deploy notes, font substitution record, brand-originality statement
```

Component inventory for builders (maps to agent12 §6 C1–C23): SiteHeader, SiteFooter,
Hero, Button, Card, Marquee, TabShowcase, StatCards, IntegrationTiles, FeatureCards,
SplitBand, CaseStudyCards (placeholder brands only), EnterpriseGrid, FinalCta,
BillingToggle, PlanCards, ComparisonTable (semantic `<table>`), Accordion,
SearchFilter, TemplateCard/IntegrationCard, AnchorNav, Reveal, GlowField.

Accessibility upgrades over the reference (per agent12 §3/§5): real `<main id="main">`
+ skip link, real `<h1>` on every page, semantic `<table>` for the comparison,
`prefers-reduced-motion` support, full keyboard handling on dropdowns/tabs/accordions.

---

## 3. APIs

**None required for core pages.** All marketing content is static-renderable.

- A-1 · **GitHub REST API (optional):** `api.github.com/repos/n8n-io/n8n` for a live star count
  in the header pill. Default: hardcode an approximate count with a documented refresh note;
  client-side fetch with graceful fallback is allowed but not required.
- A-2 · **Outbound links only** (plain anchors, no integration): sign-in/register targets,
  docs/blog/forum/community/learn/experts/luma URLs — verify against report.md §3 at build time.
- A-3 · Forms ("Talk to sales", contact, newsletter): no endpoints were observed (recon was
  read-only). Build forms as front-end only with a clearly-marked stub submit handler;
  do not invent backend behavior.

---

## 4. Implementation roadmap

Order: shared chrome → homepage → pricing → catalog pages → features → QA.

1. **Foundation:** `tokens.css` (agent12 §2 values), `base.css` (landmarks, skip link, focus,
   reduced-motion), Button/Card/Reveal/GlowField components; ORIGINAL logo + social glyphs.
2. **Global chrome:** SiteHeader (fixed pill, 1rem radius, midnight-navy 70% + blur,
   hide-on-scroll, chevron dropdowns, star pill, CTAs, mobile drawer), SiteFooter (pre-footer
   glow layer, inset rounded card, 3 link columns, legal bar). Verify at 1440/768/390.
3. **Homepage (F2):** hero → tab showcase → social proof → logo marquee (original text marks)
   → integrations band → feature trio → two alternating bands → case studies (placeholder
   brands) → enterprise band → testimonial marquee → final CTA. All-dark per agent12 §5.1.
4. **Pricing (F3):** billing toggle (annual default, monthly figures marked data-unknown until
   content agent confirms), 4 plan cards with expanders, explainer banner, "something else"
   row, semantic comparison table with Cloud/Core tabs, FAQ accordion (~20 paraphrased Q&As).
5. **Catalog pages (F4/F5):** search + pills + sidebar filters over curated JSON datasets,
   Load-more grids, counts shown as replica's own curated totals (do not copy reference's
   exact counts as facts).
6. **Features (F6):** anchor-nav hero + five sections, testimonials, final CTA.
7. **Cross-cutting (F7):** responsive pass (640/768/1024/1280/1536/1440px tokens), motion pass
   (reveals, marquees, hover lifts), SEO (titles/meta/og, semantic HTML), a11y audit,
   performance (no frameworks; lazy-load below-fold visuals), final visual compare vs. recon
   screenshots.

**Data/content unknowns the content/data agents must resolve:** monthly plan prices,
comparison-table cell values, FAQ text, template/integration card datasets, reveal
timings (use visual estimates: fade + translateY(24px), ~0.7s, staggered — verify by eye).

---

## 5. Risks & decisions

- **Brand originality risk:** every visual asset (logo, hero art, node-graph mock, "customer"
  marks) must be original; customer-logo marquee uses text-style placeholder marks only.
- **No real-company endorsement claims** in case studies — paraphrased/generic brands only.
- **Pricing is locale-dependent** (USD in source vs EUR in recon text) — model price+currency
  as data in `pricing.json`, not hardcoded copy.
- **No invented behaviors:** dropdown/tab/accordion/reveal timings are estimates; mark any
  unverified value as such and verify visually.

---

## 6. Limitations

1. **No backend was inspected or designed** because the recon found none on the marketing
   site; forms' handlers, validation, and storage are unknown (recon was read-only) and the
   clone ships front-end-only stubs — never present these as analyzed server behavior.
2. **JavaScript bundles were never fetched** (automation browser blocks view-source/devtools;
   agent12 worked from SSR HTML + CSS). Interaction timings, reveal thresholds, and dropdown
   focus management are inferred, not verified in code.
3. **The workflow-editor app, forum internals, academy/blog bodies, and auth flows were not
   inspected** (auth-walled or out of scope) — this architecture covers the marketing site only.
4. **Font metrics are estimates:** Geomanist is proprietary; Manrope's metrics will differ —
   heading rhythm must be verified visually against the recon screenshots.
5. **Data gaps:** monthly prices, comparison-table cells, FAQ text, and template/integration
   datasets were not captured by recon; they are content-agent deliverables, not architecture
   findings.
6. **No live-browser or screen-reader testing** was performed at this stage; accessibility
   claims are markup-level intentions for builders to verify.
7. **Stack recommendation is for a static replica.** If a later phase requires the interactive
   app (out of scope now), the architecture would need to be revisited.
