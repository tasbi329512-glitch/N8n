# REPLICA AI — Agent 4: Design System (n8n-clone)

Date: 2026-10-17 · Analyst: Agent 4 (Design System Agent)
Deliverables: `~/workspace/n8n-clone/design-system/` — `tokens.css`, `components.css`, `effects.css`
Load order: `tokens.css` → `components.css` → `effects.css`

Sources: recon pack `~/workspace/research_notes/n8n-clone/` (report.md, DESIGN_TOKENS.md,
FEATURE_INVENTORY.md, 3 screenshots) + agent-12 HTML/CSS analysis (real stylesheet measurements)
+ agent-13 interaction analysis. All code is original; hex values, sizes and breakpoints are
reported facts, reimplemented fresh. No reference markup, class names, styles, scripts, images,
logos or copy were carried over.

Provenance tags used in the CSS: `[OFFICIAL]` brand-guidelines values · `[MEASURED]` extracted
from the reference stylesheet · `[OBSERVED]` seen in screenshots/rendering · `[ESTIMATED]`
visual estimate, not extractable · `[CHOICE]` my decision where the reference is silent.

---

## 1. Visual analysis summary

**Art direction.** Dark, premium, glow-heavy. The captured homepage is **all-dark** — deep
purple-tinted near-blacks (`#0e0918` / `#0d0a19` / `#1b1728`), not neutral charcoal. Ambient
radial glows (pink/purple/blue) sit behind hero art, cards and the pre-footer band. A dotted
radial grid textures the tab showcase. Primary action color is an orange→red gradient
(`#fd8925` → `#ff0c00`); brand pink `#ea4b71` is used for accents, badges and glows.

**Color system.** Two exact CTA gradients measured; a 5-stop red scale; blue→violet gradient
pill CTA; body copy on dark `#d1cece` primary / `#9d9797` secondary; headings pure white with
an orange `#ff9b26` accent. Light-section color tokens exist in the reference CSS but are
**unused on the captured homepage/pricing** — the system is therefore dark-first; light
tokens are included in `tokens.css` as optional only.

**Typography.** Reference uses Geomanist (proprietary). Substitution: **Manrope** (SIL OFL,
geometric humanist sans — closest open match); documented in `tokens.css` and below. Display
scale 28→80px with tight line-heights (1.0–1.2); body 12–30px at 150% line-height; weights
300/400/500/600. Hero and section titles render 32px → 48px at the md breakpoint.

**Shape language.** Pills for header CTAs, badges and toggle knobs; the **header bar itself
is a rounded rectangle (1rem radius, measured)** — not fully round. Buttons: the measured
primary component is `rounded-lg` (0.5rem), min-height 2.5rem, px-5, text-sm. Cards: 1px
translucent borders, 16–24px radii, inner radial glows instead of drop shadows. Footer: dark
rounded card (2rem radius) inset 16–24px from viewport edges.

**Spacing & layout.** Content measure ≈1440px outer / ≈1200px inner (observed estimates).
Section rhythm `clamp(4.5rem, 8vw, 8rem)` vertical (estimate — exact gap utilities were not
extractable). 12-col grid; trios 3→1, case studies 2→1, capability grid 4→2→1.

**Motion language.** Marquee loops (duplicated track, translate 0→−50%, 15s default via CSS
var, pause on hover, edge-fade masks); scroll reveals (fade + translateY 24px, ~0.7s
ease-out, staggered — visual estimate); 0.35s tab crossfades; button hover scale(1.02) +
brightness; card hover lift −4px. Header **hides on scroll** (transform, 300ms).

**Breakpoints (measured, Tailwind v4):** sm 40rem (640px) · md 48rem (768px) · lg 64rem (1024px)
· xl 80rem (1280px) · 2xl 96rem (1536px); plus an xxl 1440px container token.

**Visual consistency notes.** The system is highly consistent: one gradient family, one card
treatment, one button treatment, one reveal motion. The two intentional deviations from the
reference are accessibility upgrades: skip link + `<main>` landmark styles, real-`<h1>`
typography classes, semantic `<table>` styles, and a full `prefers-reduced-motion` block
(the reference has none — verified by search).

---

## 2. Corrections applied (superseding stale recon estimates)

1. **All-dark pages.** Report.md §1/§2 described light "integrations band / feature trio"
   sections; the 2026-10-17 capture and stylesheets show an all-dark homepage. Built dark;
   light tokens kept optional.
2. **Header radius 1rem**, not fully round (measured `rounded-2xl`).
3. **Header hides on scroll** (300ms transform), not merely sticky — `.ds-header--hidden`
   class provided; JS toggle is a build-agent task.
4. **Primary button is rounded-lg / min-h 2.5rem / px-5 / text-sm** (measured component),
   distinct from the fully-round header pill CTA — both variants provided.
5. **Marquee default speed 15s** via CSS var (measured); earlier "~30s" was an estimate.
6. **Pricing currency is locale-dependent** (USD in source vs EUR in recon) and monthly
   prices were never recorded — treated as data, flagged for the plan/data agent.
7. Dropdown close mechanics (outside-click/Escape) and reveal trigger thresholds were not
   verifiable — specced as accessibility requirements, not as measured behavior.

---

## 3. Token reference (condensed; full spec in `tokens.css`)

| Group | Key tokens |
|---|---|
| Brand | `--ds-brand-pink #ea4b71`, `--ds-brand-black #040506`, `--ds-white #ffffff` [OFFICIAL] |
| Dark surfaces | `#0e0918`, `#0d0a19`, `#1b1728`, `#272333`, `#1f192a`, card `#1a1624` [MEASURED] |
| Text on dark | headings `#fff`, body `#d1cece`, muted `#9d9797`, accent `#ff9b26` [MEASURED] |
| Gradients | `--ds-gradient-cta` 77.24° `#fd8925`→`#ff0c00`; `--ds-gradient-cta-alt`; `--ds-gradient-blue` `#077ac7`→`#6b21ef` [MEASURED stops] |
| Glows | pink/purple/blue rgba tints [OBSERVED] |
| Type | Manrope (substitute for Geomanist); display 28–80px; body 12–30px @150%; weights 300–600 |
| Radius | sm .25 → huge 2rem; pill 999px [MEASURED scale] |
| Breakpoints | 40/48/64/80/96rem [MEASURED] |
| Header | offset 8px (16px @md), nav 58px, radius 1rem, navy 70%→20% @lg, blur 16px, z 1000, hide 300ms |
| Motion | marquee 15s; reveal 0.7s/24px/ease-out (est.); tabs 0.35s (est.); dropdown 0.2s (est.) |

**Font substitution, documented:** Geomanist is commercial and its files were never
downloaded. The system declares `Manrope` (OFL) as the closest open geometric-humanist
match. Metrics will differ slightly from the reference — verify heading sizes visually
during the build.

---

## 4. Component inventory (`components.css` + `effects.css`)

Every class uses the `ds-` prefix; none reuse reference class names. Coverage against the
agent-12 component map: SiteHeader, SiteFooter, Hero, Button (cta / cta2 / blue / pill /
ghost / light / dark, disabled state, animated icon), Card (navy/deep/3 tint/cta variants),
Marquee (speed/direction CSS vars, pause-on-hover, edge fade), Tabs (accent bar, ARIA-ready),
Accordion (animated, aria-expanded wiring), BillingToggle, PlanCards, ComparisonTable
(semantic `<table>`), StatCards, Testimonial cards, IntegrationTiles, FeatureCards,
SplitBand, CaseStudyCards, EnterpriseGrid, FinalCta, SearchFilter (input/pills/grid),
Explainer banner, GlowField/dot-grid/star-speck backgrounds, Reveal (with stagger helpers),
skip link, sr-only, focus-visible, responsive hide helpers, spin/shimmer keyframes,
`prefers-reduced-motion` overrides.

**For the build agent:** wire JS for (a) header hide-on-scroll (`is-hidden` class),
(b) dropdown open state (`data-open`) with outside-click/Escape close, (c) mobile drawer,
(d) tabs (`aria-selected` + panel swap), (e) accordion (`aria-expanded`), (f) billing toggle
price swap (prices = data, confirm monthly figures), (g) IntersectionObserver reveal
(`.is-visible`), (h) "Load more" grids. Keep all copy paraphrased, all artwork original,
all logos/text-marks original (customer wordmarks must be original text marks; case-study
brands must be generic/placeholder per inventory F2.9). Brand identity itself (name, logo,
wordmark) is Agent 10's job — this system is brand-neutral by design.

---

## 5. Open questions carried forward (not mine to invent)

1. Reveal timing/easing/stagger — visual estimates; verify by eye against reference feel.
2. Comparison-table mobile pattern — implemented as horizontal scroll; document if changed.
3. Exact section-gap values — estimated `clamp(4.5rem, 8vw, 8rem)`; refine from screenshots.
4. Monthly plan prices — never recorded by recon; plan/data agent must supply or mark unknown.
5. Blue-gradient button angle — stops measured, angle estimated at 90°.

---

## 6. Limitations

1. **No live-browser verification.** As a subagent I cannot operate the live browser; hover,
   focus, scroll, dropdown, drawer and reduced-motion behaviors were not observed in action.
   They are implemented from measured CSS where available and marked `[ESTIMATED]`/`[CHOICE]`
   elsewhere.
2. **Behavioral JS never inspected.** Only SSR HTML + CSS were available to the analysis
   chain (agent-12/13). Scroll-reveal triggers, tab keyboard behavior, dropdown animation
   and focus management, header hide thresholds, accordion mechanics and marquee duplication
   logic are inferred, not verified in code.
3. **Some exact values unrecoverable.** Section-gap utilities, `max-w-section-layout` px,
   hero art dimensions, and gradient angles are visual estimates — labeled as such.
4. **Font metrics unverified.** Geomanist's exact weights/metrics are unknown; the Manrope
   substitution will render slightly differently — headings need visual sign-off.
5. **Mobile states partially captured.** The open hamburger menu, stacked tab showcase,
   stacked plan cards and footer stacking were not captured open; responsive notes for those
   remain inferences from the component model.
6. **Out-of-scope areas not inspected:** app.n8n.cloud (auth-walled), forum internals,
   academy/blog bodies, /vs/, /ai-benchmark/, /reports/*, /education/, most use-case detail
   pages — none were opened, so no tokens were derived from them.
7. **Accessibility not audited beyond markup.** No screen-reader, keyboard or contrast testing
   was performed; the a11y additions (skip link, reduced-motion, semantic table) are
   improvements over the reference, untested against the real pages.
8. **Copy and artwork are placeholders-by-design.** All text content must be paraphrased and
   all visuals created original by the build/branding agents — this system ships structure
   and style only, no content.
