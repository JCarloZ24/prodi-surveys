-- Self-service survey links. When an enumerator chooses "self-service" after the
-- Register step, we attach an unguessable access code to the already-created draft
-- submission row. The respondent opens /s/<enumerator-slug>/<access_code> to finish
-- the survey themselves on their own device.
--
-- resume_state carries the raw client-store shapes (reg, qual, rType) so the resumed
-- flow hydrates loss-free: registration_data / profiles_data are human-readable label
-- maps that don't round-trip back into the camelCase store, and the correct survey
-- path (rType) is needed to load the right Kobo form.
--
-- Self-service drafts keep status = 'started' (like every other pre-submit draft) and
-- are distinguished by access_code IS NOT NULL, so no status-filtering logic changes.

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS access_code text,
  ADD COLUMN IF NOT EXISTS resume_state jsonb;

-- Partial unique index: only rows that actually have a code are constrained, so the
-- many rows with a NULL access_code don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS submissions_access_code_key
  ON public.submissions (access_code)
  WHERE access_code IS NOT NULL;
