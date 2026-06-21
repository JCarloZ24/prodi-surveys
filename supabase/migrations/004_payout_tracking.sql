-- Track payout lifecycle per submission independently of QA status.
alter table submissions
  add column if not exists payout_status text,
  add column if not exists paid_at timestamptz;

-- payout_status values: pending | approved | paid | on_hold
create index if not exists submissions_payout_status_idx on submissions (payout_status);
