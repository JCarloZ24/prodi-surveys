-- Remember whether the enumerator offered a token/payout for this respondent
-- (the Register-step toggle). Stored on the partial row at the verify step so a
-- self-service link can carry the choice into the respondent's session — otherwise
-- the survey-only flow would always default to offering a payout. NULL = unspecified
-- (treated as offered, the default).
alter table public.submissions
  add column if not exists payout_offered boolean;
