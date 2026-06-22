-- Admin-managed referrers. Each referrer has a generated PS-XXXX code that also
-- works as a survey referral code. All access goes through service-role API
-- routes (RLS on, no anon/auth policies).
create type referrer_type as enum ('enumerator', 'respondent', 'others');

create table referrer (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text,
  phone           text,
  type            referrer_type not null,
  payout_details  jsonb,
  referral_code   text not null unique,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index referrer_type_idx on referrer (type);

alter table referrer enable row level security;
