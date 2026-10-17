-- ============================================================
-- Flowmint database migration 004
-- Pricing: plans, billing periods, comparison matrix, FAQs (F3)
--
-- Prices are stored as minor units + ISO-4217 currency so the
-- front-end can switch locale (architecture §5: USD vs EUR).
-- NEVER hardcode displayed prices in HTML.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             TEXT UNIQUE NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,40}$'),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    tagline         TEXT CHECK (char_length(tagline) <= 160),
    -- NULL price + is_custom=true  => "Enterprise: custom"
    price_minor     INTEGER CHECK (price_minor >= 0),
    currency        TEXT NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
    billing_period  TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (billing_period IN ('monthly', 'annual')),
    executions_quota INTEGER CHECK (executions_quota >= 0),
    is_custom       BOOLEAN NOT NULL DEFAULT FALSE,
    is_highlighted  BOOLEAN NOT NULL DEFAULT FALSE,
    expandable      BOOLEAN NOT NULL DEFAULT FALSE,
    position        INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pricing_plans_price_consistency
        CHECK ((is_custom = TRUE AND price_minor IS NULL)
            OR (is_custom = FALSE AND price_minor IS NOT NULL))
);

DROP TRIGGER IF EXISTS trg_pricing_plans_updated_at ON public.pricing_plans;
CREATE TRIGGER trg_pricing_plans_updated_at
    BEFORE UPDATE ON public.pricing_plans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- Comparison table (F3.5): grouped rows × plans
-- edition = 'cloud' | 'core' (the two tabs on the reference page)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comparison_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    edition     TEXT NOT NULL CHECK (edition IN ('cloud', 'core')),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    UNIQUE (edition, name)
);

CREATE TABLE IF NOT EXISTS public.comparison_rows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES public.comparison_groups(id) ON DELETE CASCADE,
    label       TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
    hint        TEXT CHECK (char_length(hint) <= 200),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    UNIQUE (group_id, label)
);

CREATE TABLE IF NOT EXISTS public.comparison_cells (
    row_id      UUID NOT NULL REFERENCES public.comparison_rows(id) ON DELETE CASCADE,
    plan_id     UUID NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
    kind        public.cell_kind NOT NULL DEFAULT 'dash',
    value_text  TEXT CHECK (char_length(value_text) <= 120),
    PRIMARY KEY (row_id, plan_id),
    CONSTRAINT comparison_cells_value_consistency
        CHECK ((kind = 'text' AND value_text IS NOT NULL)
            OR (kind <> 'text'))
);

-- ----------------------------------------------------------------
-- FAQ accordion (F3.6): ~20 paraphrased Q&As, page-scoped
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug       TEXT NOT NULL REFERENCES public.content_pages(slug)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    question        TEXT NOT NULL CHECK (char_length(question) BETWEEN 8 AND 220),
    answer          TEXT NOT NULL CHECK (char_length(answer) BETWEEN 20 AND 2000),
    position        INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS faqs_page_position_idx
    ON public.faqs (page_slug, position) WHERE is_published = TRUE;

COMMIT;
