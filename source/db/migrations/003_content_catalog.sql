-- ============================================================
-- Flowmint database migration 003
-- Content catalog: pages, categories, integrations, templates,
-- testimonials, case studies, site stats
--
-- IMPORTANT ORIGINALITY RULE (see architecture §5):
--   * titles/descriptions are the replica's own paraphrased copy,
--     NEVER verbatim reference text
--   * glyph_key points at ORIGINAL SVG glyphs in assets/icons/,
--     NEVER lifted logo files
--   * counts shown on the site are the replica's curated totals
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- Content pages (SEO/meta per route)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    meta_description TEXT NOT NULL CHECK (char_length(meta_description) BETWEEN 40 AND 160),
    og_image_key    TEXT,
    h1              TEXT NOT NULL,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_content_pages_updated_at ON public.content_pages;
CREATE TRIGGER trg_content_pages_updated_at
    BEFORE UPDATE ON public.content_pages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- Integration categories & types
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 60),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    short_description TEXT NOT NULL CHECK (char_length(short_description) BETWEEN 10 AND 220),
    category_id     UUID REFERENCES public.integration_categories(id) ON DELETE SET NULL,
    glyph_key       TEXT NOT NULL CHECK (glyph_key ~ '^[a-z0-9][a-z0-9/_-]{1,80}$'),
    website_url     TEXT CHECK (website_url ~ '^https://[^\s/$.?#].\S*$'),
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    search_tsv      TSVECTOR,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_integrations_updated_at ON public.integrations;
CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- Template categories, creators, templates (F4)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.template_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 60),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle      TEXT UNIQUE NOT NULL CHECK (handle ~ '^[a-zA-Z0-9_.]{2,40}$'),
    name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    bio         TEXT CHECK (char_length(bio) <= 280),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    description     TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 600),
    category_id     UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
    creator_id      UUID REFERENCES public.creators(id) ON DELETE SET NULL,
    difficulty      TEXT NOT NULL DEFAULT 'beginner'
                    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    node_count      INTEGER NOT NULL DEFAULT 0 CHECK (node_count >= 0),
    -- Which homepage/catalog sections this template appears in, e.g. {"newcomer": true}
    sections        JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    search_tsv      TSVECTOR,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_templates_updated_at ON public.templates;
CREATE TRIGGER trg_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- Testimonials, case studies, site stats (homepage / features)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote       TEXT NOT NULL CHECK (char_length(quote) BETWEEN 10 AND 500),
    author      TEXT NOT NULL CHECK (char_length(author) BETWEEN 1 AND 80),
    handle      TEXT CHECK (handle ~ '^@[A-Za-z0-9_.]{1,40}$'),
    -- Only placeholder/generic brands: never claim real-company endorsement
    brand_label TEXT CHECK (char_length(brand_label) BETWEEN 1 AND 80),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated_at
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.case_studies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'),
    headline    TEXT NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 140),
    metric      TEXT CHECK (char_length(metric) BETWEEN 1 AND 60),
    quote       TEXT NOT NULL CHECK (char_length(quote) BETWEEN 10 AND 500),
    brand_label TEXT NOT NULL CHECK (char_length(brand_label) BETWEEN 1 AND 80),
    is_placeholder_brand BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_case_studies_updated_at ON public.case_studies;
CREATE TRIGGER trg_case_studies_updated_at
    BEFORE UPDATE ON public.case_studies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.site_stats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT UNIQUE NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,40}$'),
    label       TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
    value       TEXT NOT NULL CHECK (char_length(value) BETWEEN 1 AND 40),
    position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
