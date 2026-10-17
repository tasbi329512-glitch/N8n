-- ============================================================
-- Flowmint database migration 006
-- Indexes, full-text search triggers, and Row Level Security.
--
-- Role model (create/grant these in your hosted DB):
--   n8nclone_anon  — public website backend reader
--   n8nclone_app   — server-side API writer (form intake, CMS proxy)
--   n8nclone_admin — CMS staff (via session auth in app layer)
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Full-text search: keep search_tsv current on catalog writes
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_integration_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv :=
        to_tsvector('english',
            unaccent(coalesce(NEW.name, '')) || ' ' ||
            unaccent(coalesce(NEW.short_description, '')));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_integrations_tsv ON public.integrations;
CREATE TRIGGER trg_integrations_tsv
    BEFORE INSERT OR UPDATE OF name, short_description ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.refresh_integration_tsv();

CREATE OR REPLACE FUNCTION public.refresh_template_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv :=
        to_tsvector('english',
            unaccent(coalesce(NEW.title, '')) || ' ' ||
            unaccent(coalesce(NEW.description, '')));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_templates_tsv ON public.templates;
CREATE TRIGGER trg_templates_tsv
    BEFORE INSERT OR UPDATE OF title, description ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.refresh_template_tsv();

CREATE INDEX IF NOT EXISTS integrations_search_idx
    ON public.integrations USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS templates_search_idx
    ON public.templates USING GIN (search_tsv);

-- ----------------------------------------------------------------
-- 2. Catalog read indexes (the site's list/search/filter pages)
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS integrations_published_idx
    ON public.integrations (category_id, is_featured DESC, name)
    WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS templates_published_idx
    ON public.templates (category_id, is_featured DESC, published_at DESC)
    WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS templates_sections_idx
    ON public.templates USING GIN (sections);

CREATE INDEX IF NOT EXISTS templates_creator_idx
    ON public.templates (creator_id) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS pricing_plans_published_idx
    ON public.pricing_plans (position) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS comparison_cells_plan_idx
    ON public.comparison_cells (plan_id);

CREATE INDEX IF NOT EXISTS testimonials_published_idx
    ON public.testimonials (position) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS case_studies_published_idx
    ON public.case_studies (position) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS site_stats_published_idx
    ON public.site_stats (position) WHERE is_published = TRUE;

-- ----------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE public.content_pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_rows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_cells       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log              ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3a. Public content: anon SELECT on published rows only.
--     Drafts/unpublished content is invisible to the website.
-- ----------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'content_pages', 'integration_categories', 'integrations',
        'template_categories', 'creators', 'templates',
        'testimonials', 'case_studies', 'site_stats',
        'pricing_plans', 'faqs'
    ] LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            'public_read_published_' || t, t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT TO n8nclone_anon '
            'USING (is_published = TRUE)',
            'public_read_published_' || t, t);
    END LOOP;
END $$;

-- comparison_groups/rows/cells have no is_published flag: they are
-- visible only through published plans; still gate them to anon read
-- (cells joined to unpublished plans are filtered in the query layer).
DROP POLICY IF EXISTS public_read_comparison ON public.comparison_groups;
CREATE POLICY public_read_comparison ON public.comparison_groups
    FOR SELECT TO n8nclone_anon USING (TRUE);
DROP POLICY IF EXISTS public_read_comparison ON public.comparison_rows;
CREATE POLICY public_read_comparison ON public.comparison_rows
    FOR SELECT TO n8nclone_anon USING (TRUE);
DROP POLICY IF EXISTS public_read_comparison ON public.comparison_cells;
CREATE POLICY public_read_comparison ON public.comparison_cells
    FOR SELECT TO n8nclone_anon USING (TRUE);

-- ----------------------------------------------------------------
-- 3b. Form intake: anon INSERT only. No SELECT/UPDATE/DELETE —
--     the front-end can submit but never list submissions.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS form_intake_insert ON public.form_submissions;
CREATE POLICY form_intake_insert ON public.form_submissions
    FOR INSERT TO n8nclone_anon
    WITH CHECK (
        -- enforce the per-form email rule at the DB layer too
        (form <> 'newsletter' OR email IS NOT NULL)
        AND char_length(payload::text) <= 8192
    );

DROP POLICY IF EXISTS consent_record_insert ON public.consents;
CREATE POLICY consent_record_insert ON public.consents
    FOR INSERT TO n8nclone_anon WITH CHECK (TRUE);

-- ----------------------------------------------------------------
-- 3c. CMS admin: full access to content tables (app layer checks
--     the session role; service key never ships to the browser).
-- ----------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'content_pages', 'integration_categories', 'integrations',
        'template_categories', 'creators', 'templates',
        'testimonials', 'case_studies', 'site_stats',
        'pricing_plans', 'comparison_groups', 'comparison_rows',
        'comparison_cells', 'faqs'
    ] LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            'cms_admin_all_' || t, t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO n8nclone_admin '
            'USING (TRUE) WITH CHECK (TRUE)',
            'cms_admin_all_' || t, t);
    END LOOP;
END $$;

-- Staff tables: admin only, never anon.
DROP POLICY IF EXISTS cms_staff_only ON public.cms_users;
CREATE POLICY cms_staff_only ON public.cms_users
    FOR ALL TO n8nclone_admin USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS cms_staff_only ON public.cms_sessions;
CREATE POLICY cms_staff_only ON public.cms_sessions
    FOR ALL TO n8nclone_admin USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS cms_staff_read ON public.form_submissions;
CREATE POLICY cms_staff_read ON public.form_submissions
    FOR SELECT TO n8nclone_admin USING (TRUE);

DROP POLICY IF EXISTS cms_staff_read ON public.consents;
CREATE POLICY cms_staff_read ON public.consents
    FOR SELECT TO n8nclone_admin USING (TRUE);

DROP POLICY IF EXISTS cms_staff_read ON public.audit_log;
CREATE POLICY cms_staff_read ON public.audit_log
    FOR SELECT TO n8nclone_admin USING (TRUE);

-- audit_log: append-only — admin may INSERT, never UPDATE/DELETE.
REVOKE UPDATE, DELETE ON public.audit_log FROM n8nclone_admin;

-- ----------------------------------------------------------------
-- 4. Default grants (adjust to your host's role names)
-- ----------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO n8nclone_anon, n8nclone_app, n8nclone_admin;

GRANT SELECT ON
    public.content_pages, public.integration_categories, public.integrations,
    public.template_categories, public.creators, public.templates,
    public.testimonials, public.case_studies, public.site_stats,
    public.pricing_plans, public.comparison_groups, public.comparison_rows,
    public.comparison_cells, public.faqs
TO n8nclone_anon;

GRANT INSERT ON public.form_submissions, public.consents TO n8nclone_anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8nclone_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n8nclone_admin;

COMMIT;
