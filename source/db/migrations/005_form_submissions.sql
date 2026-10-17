-- ============================================================
-- Flowmint database migration 005
-- Front-end form submissions (A-3): contact, newsletter,
-- talk-to-sales. Write-once table; never exposed publicly.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form            public.form_type NOT NULL,
    -- Allowlisted payload only: name, email, company, message, etc.
    -- Validated at the API layer against a per-form field whitelist.
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    email           TEXT CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    -- HMAC-SHA256 hex of client IP: enough for abuse-rate math, no raw PII
    ip_hash         TEXT,
    user_agent      TEXT CHECK (char_length(user_agent) <= 512),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT form_submissions_newsletter_email
        CHECK (form <> 'newsletter' OR email IS NOT NULL)
);

COMMENT ON TABLE public.form_submissions IS
    'Append-only. Read access is staff-only; the site front-end has '
    'INSERT only. Subject to the retention policy in SECURITY notes.';

CREATE INDEX IF NOT EXISTS form_submissions_created_idx
    ON public.form_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS form_submissions_form_created_idx
    ON public.form_submissions (form, created_at DESC);

-- ----------------------------------------------------------------
-- Consent log (privacy compliance evidence)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    purpose     TEXT NOT NULL CHECK (purpose IN ('newsletter', 'marketing')),
    granted     BOOLEAN NOT NULL,
    source_form UUID REFERENCES public.form_submissions(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consents_email_idx ON public.consents (email);

COMMIT;
