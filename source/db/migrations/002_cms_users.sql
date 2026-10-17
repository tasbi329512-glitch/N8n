-- ============================================================
-- Flowmint database migration 002
-- CMS users, roles, sessions (optional backend; see SECURITY notes)
-- Passwords: argon2id/bcrypt hashes ONLY — never plaintext.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.cms_users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 CITEXT UNIQUE NOT NULL,
    password_hash         TEXT NOT NULL CHECK (char_length(password_hash) >= 60),
    role                  public.cms_role NOT NULL DEFAULT 'viewer',
    display_name          TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
    locked_until          TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cms_users IS
    'Staff accounts for the optional CMS that feeds the static JSON datasets. '
    'Email is case-insensitive (citext). Secrets live in a vault, never here.';

DROP TRIGGER IF EXISTS trg_cms_users_updated_at ON public.cms_users;
CREATE TRIGGER trg_cms_users_updated_at
    BEFORE UPDATE ON public.cms_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Short-lived opaque session tokens (hashed at rest).
CREATE TABLE IF NOT EXISTS public.cms_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.cms_users(id) ON DELETE CASCADE,
    token_sha256  TEXT NOT NULL UNIQUE CHECK (char_length(token_sha256) = 64),
    expires_at    TIMESTAMPTZ NOT NULL CHECK (expires_at > NOW()),
    revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cms_sessions_user_idx ON public.cms_sessions (user_id);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry_idx ON public.cms_sessions (expires_at)
    WHERE revoked = FALSE;

COMMIT;
