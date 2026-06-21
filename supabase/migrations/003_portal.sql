-- TSI respondents receive a tumbler giveaway instead of cash; store shipping details.
alter table submissions add column if not exists shipping_details jsonb;

-- Add useful index for the portal's status-based queries.
create index if not exists submissions_status_idx on submissions (status);
create index if not exists submissions_survey_type_idx on submissions (survey_type);

-- Service role can read and update all submissions (for the portal).
-- The anon role still has NO SELECT/UPDATE access (RLS stays enabled).
-- Service role bypasses RLS by default in Supabase, so no explicit policy is
-- needed — this comment documents the intended access pattern.

-- Allow service role to update submission status (QA actions).
-- (Service role bypasses RLS, so this is already satisfied; the comment below
-- confirms intentional design rather than granting new access.)

-- Explicitly deny anon from reading submissions (belt-and-suspenders).
-- anon already has no SELECT policy, so submissions.* is locked from the client.
