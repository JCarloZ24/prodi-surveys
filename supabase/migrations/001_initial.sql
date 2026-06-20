-- OTP codes for email verification (15-min expiry)
create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);
create index on otp_codes (email, expires_at);

-- Survey submissions (one row per completed survey)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  registration jsonb not null,
  qualification jsonb not null,
  survey_type text not null,
  answers jsonb not null,
  selfie_url text,
  payout_details jsonb,
  referrer_code text,
  status text default 'submitted'
);

-- Enable RLS
alter table otp_codes enable row level security;
alter table submissions enable row level security;

-- Anon can insert and read OTP codes (public survey — no auth)
create policy "anon insert otp" on otp_codes for insert to anon with check (true);
create policy "anon select otp" on otp_codes for select to anon using (true);
create policy "anon update otp" on otp_codes for update to anon using (true);

-- Anon can insert submissions
create policy "anon insert submission" on submissions for insert to anon with check (true);

-- Storage bucket for selfie photos (public, UUID filenames)
insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', true)
on conflict (id) do nothing;

-- Allow anon uploads to selfies bucket
create policy "anon upload selfies"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'selfies');
