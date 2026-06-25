-- Track when a submission was last modified. Set manually by the API on every
-- update (matching the profiles / app_settings / referrer convention), seeded
-- to created_at for existing rows so the column is never null.
alter table public.submissions
  add column if not exists updated_at timestamptz not null default now();

update public.submissions
  set updated_at = coalesce(created_at, now())
  where updated_at is null;
