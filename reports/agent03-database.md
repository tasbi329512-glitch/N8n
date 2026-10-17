# REPLICA AI — Database Agent Report (n8n-clone)

Date: 2026-10-17 · Agent 3 (Database Agent) · Project: n8n-clone
Inputs: `~/workspace/n8n-clone/reports/agent02-architecture.md`,
`~/workspace/research_notes/n8n-clone/` (report.md, FEATURE_INVENTORY.md).

Deliverables:
- Schema snapshot: `~/workspace/n8n-clone/source/db/schema.sql`
- Migrations: `~/workspace/n8n-clone/source/db/migrations/` (001–006)
- Config example: `~/workspace/n8n-clone/source/db/.env.example` (placeholders only; no real secrets)

## Scope decision (read this first)

Agent 2's architecture ships the marketing site as **static HTML + JSON**, with **no
backend and no database** for the core pages (§1: "No database — nothing on the marketing
site stores data; the pipeline's 'database migrations' deliverable is N/A for this project
(documented, not skipped)").

This task explicitly asked for schemas, migrations, indexes, validation, and security
policies anyway, so I designed a **PostgreSQL 15+ schema for the OPTIONAL backend phase**:
a CMS that feeds the static JSON datasets (`data/templates.json`,
`data/integrations.json`, `data/pricing.json`, `data/faq.json`) plus append-only intake
for the three front-end form stubs (contact, newsletter, talk-to-sales — architecture A-3).
For the static deploy, `DB_ENABLED=false` and nothing reads these tables.

**Frontend-only storage is never a backend.** Nothing here relies on localStorage,
IndexedDB, or cookies-as-database for anything authoritative. Form data, if ever
submitted, goes to a server endpoint; localStorage may at most cache read-only catalog
JSON for offline perf, never form PII.

## Schema design

### Content catalog (feeds the static JSON builders)
| Table | Purpose |
|---|---|
| `content_pages` | Page metadata: slug, h1, title, meta description (40–160 chars, enforced), og image |
| `integration_categories`, `integrations` | F5 integration tiles; `glyph_key` points at ORIGINAL SVG glyphs, never lifted logos |
| `template_categories`, `creators`, `templates` | F4 templates; `sections` JSONB maps templates to homepage/catalog sections; difficulty enum; verified-creators table |
| `testimonials`, `case_studies`, `site_stats` | Homepage bands; `case_studies.brand_label` + `is_placeholder_brand` enforce the no-real-endorsement rule |

### Pricing (F3)
| Table | Purpose |
|---|---|
| `pricing_plans` | Plan key/name, price in **minor units + ISO-4217 currency** (locale-switchable, never hardcoded), billing period, executions quota; custom-enterprise plans via `is_custom` with a CHECK forcing NULL price |
| `comparison_groups`, `comparison_rows`, `comparison_cells` | F3.5 matrix; `edition` ∈ {cloud, core}; cell kind ∈ {check, dash, text} with a CHECK requiring `value_text` only for text cells |

### Forms (A-3)
| Table | Purpose |
|---|---|
| `form_submissions` | Append-only; `form_type` enum (contact/newsletter/talk_to_sales); 8 KB payload cap; email regex validated; **raw IP is never stored** — only an HMAC-SHA256 hex digest for abuse-rate math |
| `consents` | Privacy consent evidence log |
| `audit_log` | Append-only record of CMS writes (app role denied UPDATE/DELETE) |

### CMS auth
`cms_users` (email case-insensitive via citext; password_hash must be ≥60 chars — bcrypt/argon2id only), `cms_sessions` (SHA-256 token hash at rest, expiry, revocation), with a lockout counter (`failed_login_attempts`, `locked_until`) for brute-force protection.

## Indexes
- GIN full-text indexes on `integrations.search_tsv` and `templates.search_tsv`, auto-maintained by BEFORE triggers using `english` + `unaccent` (drives F4.1/F5.1 search).
- Partial indexes on published-only rows for all catalog lists (`WHERE is_published = TRUE`).
- GIN index on `templates.sections` for section-filtered grids.
- Lookup indexes on FAQs, testimonials, case studies, stats, comparison cells, form intake by (form, created_at).

## Validation
Enforced at three layers:
1. **DB CHECK constraints** (all migrations): slug formats, email regex, currency ISO-4217, price ≥ 0, non-negative positions/quotas, description length bounds (e.g. meta description 40–160).
2. **Domain invariants**: custom plans must have NULL price and vice versa (`pricing_plans_price_consistency`); newsletter submissions require an email; text cells require `value_text`.
3. **App-layer contract** (for the build agent): form payloads must be validated against a per-form field allowlist before INSERT; DB only enforces the 8 KB cap.

## Security policies (migration 006 — RLS)
Three roles, least privilege:
- `n8nclone_anon` (website backend): **SELECT only on published rows**; **INSERT only** into `form_submissions`/`consents`; no SELECT/UPDATE/DELETE there — the public front-end can submit but never list.
- `n8nclone_app`: schema usage; server-side CMS proxy role (session checks in app layer).
- `n8nclone_admin` (CMS staff): full access to content tables; staff tables admin-only; `audit_log` append-only (UPDATE/DELETE revoked).

Secrets: none are written anywhere — `.env.example` contains only `CHANGE_ME__` placeholders. Password/session/IP-HMAC keys come from a vault or `openssl rand`. Session tokens are stored as SHA-256 digests; raw IPs are never persisted.

## Data lifecycle
- Unpublished content is invisible to the site (RLS + partial indexes).
- Form submissions are purged after `FORM_RETENTION_DAYS` (default 365) by a scheduled job the build agent will add.
- Case-study brands stay placeholder-only; testimonial handles are validated `@handle` format.

## Limitations
1. **No backend was inspected** — the reference site's server behavior, form handlers, and validation rules are unknown (recon was read-only; architecture §6.1). The intake schema is my design, not an analysis of the reference.
2. **Not tested**: migrations were written but never executed against a live PostgreSQL instance — syntax, RLS policy wiring, and trigger behavior are **untested and not verified**. The build/QA agent must run them (`psql -f`) and confirm.
3. **Role names are placeholders** — `n8nclone_anon/app/admin` must be created and granted per the host; no live DB connection exists yet.
4. **Content unknowns carried over**: monthly prices, comparison-table cell values, FAQ copy, and template/integration datasets are content-agent deliverables; the schema holds them but no seed data was written.
5. **Frontend-only caveat**: if the site ships fully static as planned, form stubs do nothing — I did not design client-side "storage" for submissions because localStorage is not a backend; intake requires the optional server.
