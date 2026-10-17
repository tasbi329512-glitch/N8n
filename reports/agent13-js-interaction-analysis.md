# Agent 13 — JavaScript & Interaction Analysis
Project: n8n-clone · Run: workflow-run-4b7bbe3422ff40d39db8a2af8ceaa61c
Source: recon pack at `/home/hatch/workspace/research_notes/n8n-clone` (report.md, FEATURE_INVENTORY.md, DESIGN_TOKENS.md, 3 viewport screenshots)
Method: read-only black-box browser analysis. **No page source, devtools, JS bundles, network logs, form submissions, logins, or signups were available.** Every behavior below was inferred from visible UI behavior and the recon analyst's click-through observations — never from inspected code. Nothing here represents hidden server code.

---

## 1. Global chrome interactions

### I-1 · Sticky floating pill header
- **Trigger:** page scroll. **State change:** header remains fixed at viewport top with ~16px offset, dark translucent (`rgba(10,10,14,.72)`) + `backdrop-filter: blur(16px)` over content beneath.
- **Rebuild note:** pure CSS `position: sticky` (or fixed) + backdrop-filter; no JS required except an optional scrolled-state class if shadow/intensity changes on scroll (not observed; don't invent one).

### I-2 · Nav dropdown menus (Product, Use cases, Docs, Community)
- **Observed mechanic (report §3):** clicking the **chevron toggles** the dropdown panel; clicking the **label text navigates** to the page directly. Panels render as dark translucent cards with the link sets enumerated in report §3.
- **State:** open/closed per menu; presumably closes on outside click / Escape and on selection (standard, but **not verified** — mark untested).
- **Rebuild note:** vanilla JS toggle (or CSS-only checkbox pattern). Required: click-outside-to-close, Escape-to-close, keyboard focusability, `aria-expanded`. Exact animation unknown (assume ~0.2s fade+translateY fade per token spec conventions; **not verified**).

### I-3 · Mobile hamburger → slide-in nav
- **Trigger:** hamburger tap on ≤~768px. **State:** drawer slides in (direction unverified — assume from right or top); submenus open as **accordions** (F1.6).
- **Status:** mobile drawer was *described* in inventory but not visually confirmed beyond the mobile screenshot existing; treat as requirement, not verified behavior.

### I-4 · GitHub star-count pill
- **Content:** "~207k" star count shown in header. **Unverified:** whether it is a live value fetched at render time or baked into the markup. No API call was observed (no network inspection available).

### I-5 · Header CTAs
- "Sign in" → `https://app.n8n.cloud/login` (external app, auth-walled, not inspected).
- "Get Started" (gradient pill) → `https://app.n8n.cloud/register`.
- Footer/section links to blog, docs, forum, community are plain outbound navigations to separate properties (report §3).

---

## 2. Homepage interactive components

### I-6 · Use-case tab showcase (5 tabs)
- **Trigger:** click one of 5 tabs on the left (IT Ops onboarding; SecOps ticket enrichment; DevOps natural-language→API; Sales review-insights; video pitch).
- **State change:** active tab gets orange-red **left accent bar**; right-side workflow-canvas visual swaps (node-graph mock with e.g. AI/Tools agent node, Slack node).
- **Rebuild note:** trivial tab JS: store active index, toggle classes, swap/crossfade visuals. Transition timing/direction unverified (assume 0.35s opacity crossfade per token spec; **not verified**). Auto-rotation on a timer was **not observed** — do not add it.

### I-7 · Logo marquee (customer logos)
- 12 grayscale marks (Microsoft, Meta, NVIDIA, Vodafone, Amadeus, Novo Nordisk, Cummins, Mistral AI, Fender, T-Mobile, Dell, Mercedes) scrolling **infinite loop**, ~30s linear, **pause on hover** (per token spec).
- **Rebuild note:** pure CSS keyframe translate with duplicated track; no JS needed. *Reminder: replica must use original text-based marks, no lifted logos.*

### I-8 · Testimonial marquee
- ~10 community quotes with author handles, same infinite-scroll mechanic as I-7.

### I-9 · Hover states
- Buttons: scale(1.02) + brightness increase. Cards (light sections): translateY(-4px) on hover. No click-through targets observed on the marquee logos themselves (non-interactive, assumed decorative; **unverified whether they link anywhere**).

### I-10 · Scroll-reveal on sections
- Sections fade + translateY(24px) → 0 over 0.7s ease-out, staggered, as they enter the viewport.
- **Rebuild note:** IntersectionObserver-driven class toggles; honor `prefers-reduced-motion`.

### I-11 · Hero CTAs
- "Get started for free" → registration URL; "Talk to sales" → sales contact route (label only; the sales/contact form page itself was not opened — its fields/validation are **uninspected**).
- 3D glass lightning-bolt visual: no rotation/interactivity observed; treat as static artwork (unverified whether any canvas/WebGL drives it — no motion seen in static screenshots).

### I-12 · Case study cards ("Read case study")
- Two cards (Huel-style, Vodafone-style) with metric + quote + CTA. CTA destination pages' structure not inspected beyond what's in the recon report. *Replica: use paraphrased, generic or placeholder brands — no real-company endorsement claims.*

---

## 3. Pricing page interactions

### I-13 · Billing-period toggle (monthly / annual)
- **Default state:** annual. **State change:** switching to monthly raises all four plan prices; annual shows ~17% saving hint.
- **Plans/prices (public list facts):** Starter 20€/mo annual (2.5k executions) · Pro 50€ (10k executions) · Business 667€ (40k executions) · Enterprise "Contact Sales" (custom).
- **Rebuild note:** JS price-data swap on toggle; monthly prices were **not recorded** by recon — plan/data agent must confirm whether to show monthly figures or mark them as data unknowns (I do not invent them).

### I-14 · Expandable plan details (Pro, Business)
- Pro and Business cards have expandable detail sections (collapsed by default, assumed; exact collapsed content unverified).

### I-15 · Comparison table tabs (Cloud / Core-features)
- "What's included?" table with tab switcher between Cloud and Core feature sets; grouped rows across 4 plan columns with check/dash cells.
- **State:** active tab re-renders the row groups; check/dash glyphs indicate plan availability.
- **Rebuild note:** tab JS swapping pre-rendered table bodies; row-group data must come from the content agent — **not captured at cell level by recon.**

### I-16 · FAQ accordion (~20 Q&As)
- Accordion items expand/collapse; animation ~0.35s ease height/opacity (per token spec; **timing unverified**). Whether multiple items can be open simultaneously: **unverified**.
- FAQ question/answer text was **not captured** — content agent must supply paraphrased Q&As.

---

## 4. Templates (/workflows/) and Integrations (/integrations/) interactions

### I-17 · Template search + category pills
- Header shows "13,490 Workflow Automation Templates"; search input filters template cards; category pills filter by category; sections: Newcomer essentials, Trending AI, Browse by category, Featured, Recently added; "What's in your stack?" band; Verified creators.
- **Implementation unknown:** client-side filtering of an embedded dataset vs. server-side search endpoint. No network inspection was possible. **Rebuild decision for later stages:** client-side filtering over a curated static dataset is the safe default (no backend in this replica); paginate/search performance is a builder concern.

### I-18 · Integration search + type filters + category sidebar + "Load more"
- Header "2,367 integrations"; search box, type filters, category sidebar; 3-column card grid; **"Load more"** appends additional cards (batch size unverified); logo strip; testimonials.
- Same implementation-unknown caveat as I-17. Card-level data (names, descriptions) **not captured** by recon.

### I-19 · /features/ anchor nav
- Hero anchor navigation jumps to page sections (visual building; AI that ships; templates; debug & monitor; deploy/self-host). Standard in-page anchor scrolling with smooth behavior (assumed; **unverified**).

---

## 5. Forms & validation

- **No form was submitted during recon (read-only assignment).** Validation behavior, error states, success flows, and any backend endpoints for the following are **entirely unverified**:
  - "Talk to sales" / contact forms (fields unknown)
  - "Join user tests" form (not submitted)
  - Any newsletter/email capture (not observed)
  - Search inputs (I-17/I-18): no-submission behavior observed; whether they use GET params, debounced XHR, or pure client filtering is **unknown**
- **No cart, checkout, or account flows exist on the marketing site** (per recon §8) — none to map.
- Login/register live behind `app.n8n.cloud` (auth-walled, not entered).

---

## 6. API dependencies (for the replica build)

These are dependencies the **replica** will need or should mock — not confirmed calls on n8n.io (none were observable):

| # | Dependency | Purpose | Notes |
|---|---|---|---|
| A-1 | None required for core marketing pages | All observed marketing content is static-renderable | Search/filter (I-17/I-18) can be client-side over static JSON |
| A-2 | GitHub REST API (`api.github.com/repos/n8n-io/n8n`) — OPTIONAL | Live star count for the header pill | Original may bake the value in markup; replica can hardcode "~207k" with a documented refresh or fetch live client-side with graceful fallback |
| A-3 | Outbound only: `app.n8n.cloud`, `docs.n8n.io`, `community.n8n.io`, `blog.n8n.io`, `learn.n8n.io`, `experts.n8n.io`, `luma.com` | CTAs, nav, footer links | Plain links, no integration work; verify URLs at build time from report §3 |

---

## 7. Backend unknowns (cannot be verified from the client side; never claim inspection)

- B-1: How the template/integration search is powered (static JSON, server endpoint, third-party search service) — unknown.
- B-2: Whether the GitHub star count is server-injected, build-time-injected, or client-fetched — unknown.
- B-3: "Talk to sales" / contact / "join user tests" form handlers, validation rules, storage, and notification flow — unknown.
- B-4: Anything behind `app.n8n.cloud` (auth, registration, workspace provisioning) — not inspected, out of scope.
- B-5: Forum (community.n8n.io), Academy (learn.n8n.io), blog CMS, changelog publishing pipeline — not inspected.
- B-6: Analytics/tracking stack, A/B testing, consent management internals — not inspected (cookies declined during recon).
- B-7: Pricing/checkout for paid plans (whether checkout happens on-site or via the app) — no checkout flow found on marketing site; unknown.
- B-8: Caching/CDN behavior, SSR vs. static export architecture — unknown; no headers or bundles inspected.

---

## 8. Limitations

1. **No source access:** view-source, devtools, JS bundles, CSS files, and network logs were unavailable in the recon environment. All event-handler/state claims above are **inferred from rendered UI behavior**, not verified against code. Timings (0.35s, 0.7s, ~30s) come from the design-token spec's conventions, not measurement.
2. **No interaction testing beyond click-through:** dropdown toggle mechanic was observed; edge cases (outside-click close, Escape, keyboard nav, multiple-open accordion items, auto-rotating tabs, marquee link targets) were **not tested — do not treat them as verified.**
3. **No form submissions:** validation, error/success states, and endpoints are entirely unknown (see §5).
4. **Auth-walled and sub-property areas not inspected:** app.n8n.cloud, community.n8n.io internals, learn.n8n.io course bodies, blog article bodies, and sitemap-only pages (/vs/, /ai-benchmark/, /reports/*, /education/, most /use-cases/* detail pages).
5. **Data gaps for builders:** monthly (non-annual) plan prices, comparison-table cell values, FAQ Q&A text, template/integration card data, and case-study page structures were not captured — these are content/data unknowns for downstream agents, not interaction findings I could supply.
6. **Screenshots were static viewports:** motion (marquee speed, reveal staggering, hover physics, tab transitions, hero visual animation) could not be timed or confirmed as CSS vs. JS-driven.
7. **Exact font family unreadable** without a CSS inspector (noted for completeness; belongs to the design-token agent).
8. **Nothing in this report describes server-side code.** Any backend behavior listed under §7 is explicitly marked as unverifiable from the client side.
