# Flowmint User Guide

**Flowmint** — AI workflows with nothing to hide.

Flowmint is a visual workflow-automation platform: connect apps, agents, and
data in a node-based canvas, inspect every execution, and scale from a first
prototype to production.

> This guide documents the **marketing site** (what's built today): product
> pages, the template and integration catalogs, pricing with an executions
> calculator, docs, community, and contact. The site is honest about what it
> is — demo figures are labeled *illustrative*, and the customer marquee,
> case studies, and testimonials are fictional placeholders clearly labeled
> on-page.

## Site map

| Page | Route | What it's for |
|---|---|---|
| Home | `/` | Positioning, hero, product tour, AI showcase, marquee, stats, FAQ |
| Features | `/features/` | Product overview: build, debug, deploy, AI automation, MCP |
| Templates | `/workflows/` | 48 workflow templates with search, filters, and detail pages |
| Integrations | `/integrations/` | 60 integrations with search, category filters, and detail pages |
| Pricing | `/pricing/` | Plans, comparison table, executions-per-month cost calculator |
| Docs | `/docs/` | Documentation landing |
| Community | `/community/` | Community landing |
| Contact | `/contact/` | Talk-to-sales / contact form |
| Legal | `/legal/` | Privacy, security, license, imprint |
| Signup / Signin | modal | Lead capture (name/email only — no accounts system yet) |

## Finding a workflow template

1. Open **Templates** (`/workflows/`).
2. Search by keyword or pick a category pill (e.g. sales, support, data).
3. Click a card to open its **detail page** (`/workflows/<slug>/`): a plain-English
   description of what the workflow does and how it's wired.
4. "Use this template" captures your email so the team can send the template.

The catalog is a curated starter set (48 templates), labeled as such on-page.

## Finding an integration

1. Open **Integrations** (`/integrations/`).
2. Search or filter by category; click a card for the detail page
   (`/integrations/<key>/`).
3. If your app is missing, use the **request-integration** form — it's a real
   endpoint, not a dead button (see "Forms" below).

The catalog is a curated starter set (60 integrations), labeled as such.

## Estimating cost (pricing calculator)

On **Pricing** (`/pricing/`):

1. Move the **executions-per-month** slider to your expected volume.
2. The calculator recommends the cheapest plan whose quota covers your
   volume and cites the exact quota it matched.
3. Toggle monthly/annual billing. Prices are EUR list prices mirrored from
   public sources; monthly figures follow the common +~20% pattern —
   re-verify before any production commitment.

Execution-based billing is the category's #1 confusion point, so every
recommendation names the quota it used. No dark patterns: plans are compared
in a semantic table with plain differences.

## Forms — what actually happens

Every form on the site (newsletter, contact, signup, signin, waitlist,
request-integration) POSTs to the real endpoint `POST /api/forms`:

- **With the API running** (`npm start`): your submission is recorded and you
  get a confirmation. That's all it promises — it records the submission.
- **Without the API** (pure static hosting): the form tells you honestly it
  "could not reach our server" instead of faking success.

Data handling: emails and allowlisted fields only — unknown fields are
rejected, emails are validated, passwords are never accepted or stored
(there is no account system in this build). Raw IPs are never stored, only an
HMAC hash used for abuse-rate math. See SETUP.md for retention and the
PostgreSQL path.

## Docs & community

- **Docs** (`/docs/`): the documentation landing — start here for concepts
  and how-tos as content grows.
- **Community** (`/community/`): where users gather; newsletter signup at the
  bottom of every page keeps you posted.
- **Contact** (`/contact/`): talk to the team; submissions go through the
  same real endpoint described above.

## Accessibility

The site ships with: skip link, `<main>` landmark, one real `<h1>` per page,
semantic tables, keyboard-operable dropdowns/tabs/accordions/drawer, visible
focus rings, and `prefers-reduced-motion` support.
