-- Revert the self-service survey feature: drop the access_code / resume_state columns
-- and their unique index added in migration 021. Idempotent so it is safe to re-run.
DROP INDEX IF EXISTS public.submissions_access_code_key;

ALTER TABLE public.submissions
  DROP COLUMN IF EXISTS access_code,
  DROP COLUMN IF EXISTS resume_state;
