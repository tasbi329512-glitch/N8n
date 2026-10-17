# REPLICA AI — Agent 12: HTML/CSS Analysis (n8n-clone)

Date: 2026-10-17 · Analyst: Agent 12 (HTML/CSS Analysis Agent)
Sources:
- Recon pack `~/workspace/research_notes/n8n-clone/` (report.md, DESIGN_TOKENS.md, FEATURE_INVENTORY.md, 3 full-page screenshots captured 2026-10-17)
- **Real source dumps** `~/workspace/research_notes/n8n-clone/source-dumps/` (captured 2026-10-17 via authorized plain-HTTP reads — the automation browser blocks view-source/devtools, so curl was used instead): `homepage.html` (351 KB, server-rendered), `pricing.html` (502 KB), 23 stylesheets incl. `entry-global.css` (169 KB global stylesheet with the design-token theme)
- Live page-text fetch of https://n8n.io/ (text layer only) and public reporting on the reference stack (Strapi case study: Nuxt 3 + SSR frontend fed by a component-driven Strapi CMS)

Everything below is paraphrased analysis. No markup, class names, stylesheets, scripts, images, logos, or copy text were lifted into the rebuild; token *values* (hex colors, font stack, sizes, breakpoints) are reported as facts for reimplementation in original code.

---

## 1. Stack & code-organization signals (from source)

- Nuxt 3 app (`<div id="__nuxt">` root, `/_nuxt/` hashed assets), server-side rendered HTML, Vue single-file components with **scoped styles** (every component's markup carries `data-v-<hash>` attributes; 19 distinct scoped ids on the homepage).
- Styling is **Tailwind v4-style utility classes** driven by a large `@theme`-like token block in the global CSS (62 `@media` blocks generated from breakpoint tokens, 3 `@container` queries), plus small per-component stylesheets (23 files; the largest page-specific one is ~37 KB).
- Class-naming pattern observed: semantic component classes (card, title, logo, navbar-wrapper, footer-main, feedback-slides-*) combined with utility classes (flex, grid, rounded-*, bg-*, text-*). BEM-ish variant suffixes on components (e.g. a Card component with ~10 visual themes: blank, dark, dark-navy, brown-gradient, red, rusty, shine-blue, CTA, …).
- Vue template artifacts in SSR HTML (`<!--[-->`, `<!---->` comments) — irrelevant for the rebuild except as confirmation of the component model: pages are composed from discrete content components (hero, band, cards, marquee, tabs, accordion, pricing table), matching the Strapi component-driven CMS model.

## 2. Exact design tokens (measured from the global stylesheet)

### Color
| Token (meaning) | Value |
|---|---|
| brand pink | `#ea4b71` |
| brand black (`base-dark`) | `#040506` |
| heading orange | `#ff9b26` |
| headings on dark | `#ffffff` |
| CTA red end | `#ff0c00` |
| CTA orange start | `#fd8925` |
| primary red scale | `#ff492c`, `#f96e49`, `#ee4f27`, `#e04722`, `#b83617` |
| body text on dark (primary / secondary) | `#d1cece` / `#9d9797` |
| button blue/violet (primary) | `#077ac7` → `#6b21ef` |
| dark surfaces (purple-tinted near-blacks) | `#0e0918` (midnight navy), `#0d0a19`, `#1b1728` (dark navy), `#272333` (lightened), `#1f192a` (deep navy) |
| card bg (arbitrary value seen in markup) | `#1A1624` |
| grays | `#a3a3a3`, `#7a7a7a`, `#464646`, `#e4e4e4`, `#f7f6fa` (hazy white), `#48556a` (slate blue) |
| loop/light section tokens (present but unused on current dark pages) | `#ffffff`, `#141414`, `#f1f1f1`, `#d6d6d6`, `#868686` |

### CTA gradients (exact)
- Orange→red: `linear-gradient(77.24deg, #fd8925 7.17%, #ff0c00 86.3%)`
- Orange variant: `linear-gradient(90deg, #ff9b26 29.28%, #ee4f27 67.8%)`

### Typography
- Family token: `geomanist, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` — **Geomanist is a proprietary font; the rebuild must substitute an open-licensed geometric sans** (e.g. Manrope) and document the substitution. A "book" weight variant token also exists.
- Type scale (size / line-height): headline-xxs 28px/120%, headline-xs 32px/100%, headline-sm 38px/100%, headline-md 48px/100%, headline-lg 54px/100%, headline-xl 54px/100%, headline-xxl 80px; body xs 12 / sm 14 / md 16 / lg 18 / xl 20 / xxl 24 / 3xl 1.875rem — all at 150% line-height; nav links 15px/100%.
- Usage: hero H1-equivalent = headline-xs → md:headline-md → lg:headline-md (32→48px); section titles same scale. Headings use a `title` component class with white/gray theme variants.

### Radius
`sm .25rem`, `md .375rem`, `lg .5rem`, `xl .75rem`, `2xl 1rem`, `3xl 1.5rem`, `default 1.5rem`, `small 1rem`, `huge 2rem`; pill buttons use an effectively-infinite radius (full rounding).

### Breakpoints
sm 40rem (640px), md 48rem (768px), lg 64rem (1024px), xl 80rem (1280px), 2xl 96rem (1536px), xxl 1440px.

### Spacing/layout
- Section vertical rhythm via named gap utilities (`py-section-gap-y` with md/lg steps — exact values not extracted, treat as the `clamp(4.5rem, 8vw, 8rem)` visual estimate).
- Content measure: `max-w-section-layout` / `max-w-section-heading` tokens (exact px not extracted; ≈1440px outer / ≈1200px inner from screenshots).
- Header uses layout padding tokens (`px-layout-nav-padding` with md/xl steps).

## 3. Semantic HTML structure (from source)

### Global landmarks — notable gaps
- **No `<main>` landmark, no `role="main"`, no skip link** on either page. The clone should add `<main id="main">` + a skip link (improvement over the reference).
- Homepage has **no `<h1>` at all** — the hero headline is nested `<div>`/`<span>` elements with typography classes. Section titles use real `<h2>` (8 on homepage). Pricing page has a proper `<h1>` ("Pricing"), 2 `<h2>`, 26 `<h3>`. The clone should use a real `<h1>` on every page.
- Homepage: 12 `<section>`, 121 `<img>`, 88 `<a>`, 11 `<ul>`, 7 `<button>`, 3 `<video>`, 1 `<nav>`, 1 `<footer>`. Pricing: 8 `<section>`, 24 `<button>`, 1 `<input>`, **zero `<table>`** — the comparison "table" is div-built (the clone should use a real `<table>`).

### ARIA actually present
- 15 `aria-label`s total: "Global navigation" on the nav (which also redundantly carries `role="navigation"`), 4 submenu labels ("Product submenu", "Use cases submenu", "Docs submenu", "Community submenu"), and 6 social-icon labels (GitHub, Discord, Linkedin, Twitter/X, youtube + one more).
- Logo link contains an `sr-only` text node ("n8n.io") alongside the inline SVG wordmark — good pattern to copy (with our own mark).
- Tab showcase: proper `role="tablist"` + 5 `role="tab"` + 5 `role="tabpanel"`.
- Pricing accordions/expanders: 26 `aria-expanded` / `aria-controls` pairs — correctly wired.
- No `role="heading"`/`aria-level` hacks; sections carry no accessible names.

### Header (from source)
- `<header class="… fixed top-0 right-0 left-0 z-1000 … transition-transform duration-300">` — fixed, very high z-index, transform transition = **hide-on-scroll** behavior (translates away on scroll down, returns on scroll up).
- Inner pill: `navbar-wrapper` — `max-w-section-layout`, `bg-shades-midnight-navy/70` (70% opacity midnight navy; `lg:` drops to 20%), `rounded-2xl` (1rem — note: the pill is a rounded rect, ~16px radius, NOT fully-round 999px as the recon visual estimate said), `mt-2 md:mt-4 lg:mt-2`, flex column.
- Nav row: `min-h-[58px]`, flex justify-between; logo left (87×24 SVG, `max-w-full`), center nav list (xl: 30% width slot), right cluster: GitHub star pill, Sign in link, CTA button.
- Logo uses `data-theme="mono"` and `router-link-active` (Nuxt router) attributes.
- Dropdown mechanic (from recon, consistent with submenu aria-labels): chevron toggles panel, label click navigates.

### Hero (from source)
- Eyebrow, headline (div-built, no h1), subcopy, CTA row: primary Button component (`btn-primary` variant, `btn-label` span, `btn-anim-icon`, `rounded-lg`, `min-h-10`, `px-5`, `text-sm`, disabled-state styling) + ghost/secondary link.
- Visual: 3D glass artwork panel with pink/purple/blue radial glows (original artwork to be created; never copy the reference file).

### Use-case tab showcase
- Left: 5 tab buttons (bold lead + muted desc), active tab = orange-red left accent bar; right: workflow-canvas visual (node circles + dashed connectors, dotted-grid background via radial-gradient dot pattern).
- Proper tablist/tab/tabpanel ARIA (see above).

### Social proof / marquees
- 3 stat cards (icon + bold stat + text) with inner pink/purple gradient glows.
- Marquee implementation (from CSS): `@keyframes` translating `0 → -50%`, `animation: <name> var(--speed, 15s) linear infinite var(--direction, forwards)` — duration and direction parameterized by CSS custom properties; content track duplicated. Edge fade via mask gradient (visually confirmed). **No `prefers-reduced-motion` handling found in any stylesheet** — the clone must add it.
- Testimonial cards: `card card--blank … rounded-small … bg-[#1A1624]`, quote + author + handle; some slides carry `opacity-0 lg:opacity-100` (hidden on mobile, shown on desktop — responsive content swap).

### Integrations band / feature trio
- Dark rounded tiles with glowing glyphs; blue→purple gradient pill CTA ("Browse all integrations").
- Feature cards: large dark rounded cards, `title--white` headings, checklist rows with check glyphs.

### Footer — structural surprise
- `<footer class="footer-main">` **wraps the bottom-of-page sections**: it contains a `footer-top-content` div holding the testimonials carousel `<section>` AND the actual footer columns. I.e. the reference's "footer" is a page-bottom wrapper component, not just the link block. The clone may structure this more conventionally (main → footer) but must preserve the visual result: pre-footer orange/red radial glow with star specks on the page background, then the dark rounded card inset ~16–24px from viewport edges.
- Footer card: brand column (logo, tagline, 5 social glyph links) + 3 link columns + pill badges ("Hiring", "Oct 2026") + bottom legal bar (Imprint | Security | Privacy | Report a vulnerability; copyright).

### Pricing page (from source)
- Real `<h1>Pricing` with `title--white section-title` + `opacity-0` (scroll reveal).
- Billing toggle: Monthly | switch | Annually (Save 17%).
- 4 plan cards: name, audience line, big price + "/mo, billed annually", dark inner stat pill (executions quota), chevron expanders on Pro/Business, gradient CTAs ("Start free trial / No credit card required"; Business "Self-hosted only"; Enterprise "Contact sales").
- Comparison "table": div-built grid with Cloud/Core tab switch and grouped rows — rebuild as a semantic `<table>`.
- FAQ: button+panel accordion with correct `aria-expanded`/`aria-controls` wiring.

## 4. CSS behavior patterns (from source)

- **Scroll reveals:** elements render with `opacity-0` (29 instances on homepage) and are revealed client-side (no `is-visible` class found in CSS — likely a JS/IntersectionObserver directive removing the class or setting opacity). Exact timing/easing not recoverable from CSS; the recon estimate (fade + translateY(24px), ~0.7s, staggered) stands as the visual target.
- **Responsive content swaps:** `opacity-0 lg:opacity-100` pattern hides some slides on mobile.
- **Motion in CSS:** marquee (15s default via `--speed`), `spin`/`spinny` keyframes (loaders/decorative), `skeleton` shimmer, tooltip fades. Transitions: header transform 300ms; cards `transition-opacity duration-300`.
- **3 container queries** exist (component-level responsive behavior — exact triggers not extracted).
- Dotted/grid backgrounds and glows are layered radial-gradients; edge fades use mask-image gradients (visually confirmed on marquees).

## 5. Key corrections to the recon pack (screenshot + source verified)

1. **The homepage is all-dark.** No light/white content bands exist in the 2026-10-17 capture or source (light-section color tokens exist in CSS but are unused on these pages). Any "light band" component from report.md §1/§2.6–2.7 is stale — build dark.
2. **Header pill radius is ~1rem (`rounded-2xl`), not fully-round.** The floating bar is a rounded rectangle.
3. **Header hides on scroll** (transform transition) — not just sticky.
4. **Pricing is locale-dependent:** source/screenshot show USD ($20/$50/$800); recon text recorded EUR. Treat price+currency as data.
5. **Hero has no `<h1>`** on the reference — the clone should use one anyway.
6. **The comparison "table" and footer link columns are div-built** — the clone should use semantic `<table>`/`<ul>` and add the missing `<main>` landmark and skip link.

## 6. Component map for the build team (original implementations)

| # | Component | Pages | Notes |
|---|---|---|---|
| C1 | `SiteHeader` | all | fixed pill (1rem radius, midnight-navy 70% + blur, hide-on-scroll), logo, dropdown nav (chevron-toggle / label-navigate, submenu aria-labels), star pill, CTAs, mobile hamburger → slide-in accordion nav |
| C2 | `SiteFooter` | all | pre-footer glow layer, inset rounded card, brand col + 3 link cols, pill badges, social glyphs (aria-labeled), legal bottom bar |
| C3 | `Hero` | home, features, pricing | eyebrow, real `h1`, subcopy, CTA row, artwork panel, ambient glows |
| C4 | `Button` (variants: gradient-orange, gradient-blue, ghost, dark) | all | label span + optional animated icon, disabled state, full-width-on-mobile |
| C5 | `Card` (theme variants: blank, dark, dark-navy, gradient tints, CTA…) | all | 1px translucent border, 16–24px radius, inner radial glows instead of shadows |
| C6 | `Marquee` (props: items, speed, direction, edge-fade) | home | duplicated track, CSS-var speed/direction, pause-on-hover, `prefers-reduced-motion` (new) |
| C7 | `TabShowcase` | home | real tablist/tab/tabpanel ARIA, accent bar, canvas visual per tab (original node-graph SVG art) |
| C8 | `StatCards` | home | icon + bold stat + text, inner glow |
| C9 | `IntegrationTiles` (+ filterable grid variant) | home, integrations | dark rounded tiles + glyph |
| C10 | `FeatureCards` | home, features | visual / h3 / body / link, checklist variant |
| C11 | `SplitBand` | home, features | alternating text/visual, bullet-list variant |
| C12 | `CaseStudyCards` | home | metric headline, logo slot, CTA — placeholder/generic brands only |
| C13 | `EnterpriseGrid` | home | 4-col capability columns |
| C14 | `FinalCta` | all | orange→red gradient panel, h2, button |
| C15 | `BillingToggle` | pricing | monthly/annual switch + savings hint |
| C16 | `PlanCards` | pricing | price, stat pill, expander (aria-expanded), CTA |
| C17 | `ComparisonTable` | pricing | semantic `<table>`, Cloud/Core tabs, grouped rows, 4 plan columns |
| C18 | `Accordion` | pricing, features | aria-expanded/controls wiring, animated expand |
| C19 | `SearchFilter` | templates, integrations | search input, category pills, sidebar, Load-more grid |
| C20 | `TemplateCard` / `IntegrationCard` | templates, integrations | title, meta, icon slot |
| C21 | `AnchorNav` | features | sticky in-page links |
| C22 | `Reveal` | all | fade+translateY on scroll into view, stagger, reduced-motion |
| C23 | `GlowField` | all | ambient radial glows, dot grids, star specks — pure CSS/SVG, original |

## 7. What must NOT be carried over

- The reference's markup, class names, CSS, JS, SVGs, images, videos, the Geomanist font files, logo files, and copy text (paraphrase all copy; write all code fresh).
- Third-party customer logos and the reference's hosted asset URLs (Azure blob `n8nio-strapi-blobs-*`): never hotlink or copy.
- Case-study claims about real companies: paraphrase into generic/placeholder form per FEATURE_INVENTORY F2.9.

## 8. Open questions for downstream agents

1. Reveal timing/easing/stagger values — not recoverable from CSS (JS-driven); use the visual estimates and verify by eye.
2. Comparison-table mobile pattern (horizontal scroll vs column picker) — choose and document.
3. Exact `py-section-gap-y` values — not extracted; derive from screenshots.
4. Heading font substitute — pick open-licensed geometric sans (Manrope recommended) and record the choice.
5. `max-w-section-layout` / `max-w-section-heading` exact px — derive from screenshots (~1440px / ~1200px).

## 9. Limitations

1. **Behavioral JS not inspected.** The dumps are SSR HTML + CSS only; no JavaScript bundles were fetched. Therefore: scroll-reveal trigger/threshold/timing, tab keyboard behavior, dropdown open/close animation and focus management, header hide-on-scroll thresholds, accordion animation mechanics, and marquee duplication logic are inferred from markup/CSS, not verified in code. (The earlier limitation about "no HTML/CSS access" is now resolved by the source dumps.)
2. **No live-browser verification.** As a subagent I cannot operate the live browser; hover states, focus rings, reduced-motion behavior, and the open mobile menu were not observed in action. `prefers-reduced-motion` handling is absent from the reference CSS (verified by search — zero hits), so its behavior is untestable there by definition.
3. **Font files not inspected.** Geomanist's exact weights/metrics are unknown; the substitute-font metrics will differ — verify headings visually.
4. **Per-component stylesheets mapped by size, not by name.** The 23 stylesheets were saved as `style-N.css` (original `/_nuxt/*.css` names are in `css-links.txt`); component-to-file mapping was done via content signatures and may be incomplete for rarely-used components.
5. **Mobile states partially captured.** The 390px screenshot shows the collapsed header and stacked hero only; the open hamburger menu, stacked tab showcase, stacked plan cards, and footer stacking were not captured open — responsive notes for those remain inferences.
6. **Pricing currency is locale-dependent** (USD in source/screenshot vs EUR in recon text) — treat as data.
7. **Out-of-scope areas not inspected:** app.n8n.cloud (auth-walled), community forum internals, academy course bodies, blog article bodies, /vs/, /ai-benchmark/, /reports/*, /education/, most /use-cases/* detail pages — none were opened.
8. **Accessibility not audited beyond markup.** No screen-reader, keyboard, or contrast testing was performed; §3 lists what the markup contains, and §6/C-items note where the clone should exceed the reference (main landmark, skip link, real h1, semantic table, reduced-motion).
9. **Third-party assets identified but not copied.** Proprietary asset URLs observed in markup are listed in §7 as must-not-carry-over and are not reproduced here.
