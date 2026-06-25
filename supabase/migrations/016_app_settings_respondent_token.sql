-- Respondent cash token per verified survey (SME / Agri-Tech paths). TSI
-- respondents receive a tumbler instead. Admin-configurable in the Settings page,
-- alongside the enumerator payout. Added to the app_settings singleton (migration 014).
alter table public.app_settings
  add column if not exists respondent_token integer not null default 200;
