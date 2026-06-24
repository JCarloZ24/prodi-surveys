-- Track the referral-bonus payout lifecycle separately from the respondent's
-- own token payout. The referrer bonus is only released after the respondent
-- has been paid (enforced in the portal UI).
alter table submissions
  add column if not exists referrer_payout_status text,
  add column if not exists referrer_paid_at timestamptz;

-- referrer_payout_status values: pending | approved | paid | on_hold
create index if not exists submissions_referrer_payout_status_idx
  on submissions (referrer_payout_status);
