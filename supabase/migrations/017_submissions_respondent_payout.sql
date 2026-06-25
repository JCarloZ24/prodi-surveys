-- Respondent token payout lifecycle, independent of the enumerator payout
-- (payout_status, migration 004) and the referrer payout (referrer_payout_status,
-- migration 013). Tracks the ₱ cash token (SME/Agri-Tech) or tumbler (TSI) given
-- to the respondent: pending | approved | paid | on_hold. Admin approves + marks
-- paid manually on the Payouts page once the response is QA-verified.
alter table public.submissions
  add column if not exists respondent_payout_status text,
  add column if not exists respondent_paid_at timestamptz;
