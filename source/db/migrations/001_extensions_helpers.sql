-- ============================================================
-- Flowmint database migration 001
-- Extensions, helper functions, enums, updated_at trigger
-- PostgreSQL 15+
-- ============================================================

BEGIN;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search over catalog content
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Case-insensitive staff email addresses
CREATE EXTENSION IF NOT EXISTS "citext";

-- ----------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------
-- Shared enums
-- ----------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.cms_role AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.form_type AS ENUM ('contact', 'newsletter', 'talk_to_sales');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cell_kind AS ENUM ('check', 'dash', 'text');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------
-- Shared audit table (populated by app layer on admin writes)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id   UUID,                       -- may be NULL for system jobs
    action          TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 80),
    target_table    TEXT NOT NULL CHECK (char_length(target_table) BETWEEN 1 AND 64),
    target_id       UUID,
    diff            JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_hash         TEXT,                       -- HMAC-SHA256 hex of client IP, never raw IP
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.audit_log IS
    'Append-only record of CMS writes. Rows are never updated or deleted by the app role.';

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx   ON public.audit_log (actor_user_id);

COMMIT;
