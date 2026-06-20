-- Persist respondent consent (terms + privacy + timestamp) with each submission.
alter table submissions add column if not exists consent jsonb;

-- OTP codes are now written/verified server-side with the service-role client
-- (see app/api/otp/route.ts), so the anon role no longer needs — and should not
-- have — any access to the otp_codes table. RLS stays enabled with no anon
-- policies, so anon is fully denied.
drop policy if exists "anon insert otp" on otp_codes;
drop policy if exists "anon select otp" on otp_codes;
drop policy if exists "anon update otp" on otp_codes;
