# Flowmint Brand Kit

**Product name:** Flowmint
**Tagline:** AI workflows with nothing to hide.
**Package identity:** `flowmint-site` (npm), `flowmint.io` canonical domain for metadata
**Brand status:** Original, independent product branding. No reference-brand names,
marks, copy, artwork, or assets anywhere in the shipped product.

## 1. Product name

**Flowmint** — a coined, category-adjacent name suggesting workflow + freshness
(mint = freshly minted). It is distinct from any known workflow-automation
brand and is used consistently everywhere a brand name appears:

- Every page `<title>` and meta description
- Open Graph tags (`og:url` canonical `https://flowmint.io/...`)
- Header/footer brand lockup, sitemap, robots.txt, README, package.json
- JavaScript namespace (`window.Flowmint`)

## 2. Logo concept

`source/assets/logo.svg` — an original, hand-authored SVG wordmark.

**The mark (icon):** three workflow **nodes** (filled circles) joined by
curved **flow paths** (bezier connectors) — the visual grammar of node-based
automation, abstracted into a compact mark:

- Two source nodes (left, top and bottom) converging through a central
  junction node into one destination node (right) — "many inputs, one flow."
- The central junction is a ring (dark fill, gradient stroke): the "agent"
  where logic happens.
- All curves use `stroke-linecap="round"` for a friendly, modern feel.

**The wordmark:** lowercase `flowmint` set in **Manrope** (600 weight,
−0.5 letter-spacing), white on dark surfaces.

**The gradient:** linear, diagonal, `#fd8925` → `#ff0c00` (warm orange to
hot red) — the signature "energy flow" accent, reused for CTA buttons,
headings accents, and the favicon.

**The favicon:** an inline data-URI SVG in every page head — the same
three-node flow motif on a `#0e0918` rounded square.

### Logo usage rules

- Keep the gradient; never substitute a single flat color for the mark.
- Maintain clear space ≥ the height of one node around the mark.
- Don't rotate, stretch, recolor, or add shadows/outlines to the SVG.
- Wordmark may be used alone only where the full lockup is shown nearby.
- Minimum display width: 80 px for the lockup, 24 px for the icon alone.

## 3. Colors

From `source/css/tokens.css` (original token system):

| Token | Hex | Use |
|---|---|---|
| `--ds-surface-page` | `#0e0918` | Primary dark page background |
| `--ds-surface-deep` | `#0d0a19` | Footer / deep sections |
| `--ds-surface-navy` | `#1b1728` | Panels |
| `--ds-surface-raised` | `#272333` | Raised layers |
| `--ds-text-on-dark` | `#ffffff` | Headings on dark |
| `--ds-text-body-dark` | `#d1cece` | Body copy on dark |
| `--ds-text-muted-dark` | `#9d9797` | Secondary copy on dark |
| `--ds-accent-orange` | `#ff9b26` | Heading accents |
| `--ds-brand-pink` | `#ea4b71` | Secondary accent |
| `--ds-red-hot` | `#ff0c00` | Gradient end / alerts |
| CTA gradient | `linear-gradient(77.24deg, #fd8925 7.17%, #ff0c00 86.3%)` | Primary buttons, hero glows |
| Alt CTA gradient | `linear-gradient(90deg, #ff9b26 29.28%, #ee4f27 67.8%)` | Hover / secondary emphasis |

Light theme: `#ffffff` background, `#141414` ink, `#868686` muted,
`#d6d6d6` lines.

## 4. Typography

- **Sans:** Manrope (Google Fonts, SIL Open Font License) — 300/400/500/600/700.
  Used for everything user-facing; was chosen as the open-license stand-in
  for the reference's proprietary typeface.
- **Mono:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — code
  snippets only.
- Display scale: 1.75rem → 5rem; body at 150% line-height.

## 5. Icon system

`source/assets/icons/icons.svg` — 19 original stroke icons, one SVG sprite
referenced with `<use href="/assets/icons/icons.svg#i-*">`:

`i-arrow` · `i-bolt` · `i-check` · `i-chevron` · `i-code` · `i-dash` ·
`i-discord` · `i-eye` · `i-github` · `i-linkedin` · `i-node` ·
`i-plus` · `i-rocket` · `i-search` · `i-shield` · `i-star` · `i-users` ·
`i-x` · `i-youtube`

(19 unique symbols; `i-node` is the node-flow glyph echoing the logo.)

## 6. Metadata & SEO identity

- Site name in all structured metadata: **Flowmint**
- Canonical domain pattern: `https://flowmint.io/...` (117 pages)
- `og:type=website`, per-page titles/descriptions, theme-color implied by
  the dark UI; `robots.txt` + `sitemap.xml` ship with the site.
- Honest-data policy (already enforced on-page): demo stat figures are
  labeled *illustrative*; customer marquee marks, case studies and
  testimonials are fictional and labeled as such.

## 7. Brand originality confirmation

On 2026-10-17 the brand kit was audited against the shipped product:

- 117 HTML pages: **0** occurrences of the reference brand name.
- Shipped CSS/JS/DB comments and headers: rebranded to Flowmint; **0**
  reference-brand mentions remain outside internal analysis reports and
  internal (non-user-facing) database identifiers.
- Name, logo, icon set, all copy, and all artwork: written/designed fresh
  for this product. Design *token values* (colors, sizes) are measured
  category facts; all selectors, code, and copy are original.
- The `reports/` directory at the project root legitimately discusses the
  reference site as analysis input — it is not part of the shipped product.
