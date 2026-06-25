-- Portal-wide configurable settings (admin Settings page): the flat enumerator
-- payout per verified survey and the per-path target counts. Singleton row.
create table if not exists public.app_settings (
  id            boolean primary key default true,
  survey_payout integer not null default 400,
  targets       jsonb   not null default '{"TSI":4,"AgriTech":10,"SME":100}'::jsonb,
  updated_at    timestamptz not null default now(),
  -- Enforce a single row: id is always true.
  constraint app_settings_singleton check (id)
);

-- Seed the singleton row with the current defaults.
insert into public.app_settings (id) values (true)
  on conflict (id) do nothing;

-- RLS on, no policies: only the service-role client (used by the portal server
-- layout and the admin settings API) can read or write. anon/auth are denied.
alter table public.app_settings enable row level security;
