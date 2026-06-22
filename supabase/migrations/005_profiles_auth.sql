-- Real per-user accounts backed by Supabase Auth (email/password).
-- profiles is 1:1 with auth.users and holds role + admin-approval state.
-- Email is validated by our own OTP flow (is_email_verified), not Supabase's
-- confirmation email, so Supabase "confirm email" is turned off.

create type user_role as enum ('admin', 'enumerator', 'stakeholder');
create type profile_status as enum ('pending', 'approved', 'rejected');

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  role              user_role not null,
  status            profile_status not null default 'pending',
  is_email_verified boolean not null default false,
  slug              text unique,
  approved_at       timestamptz,
  approved_by       uuid references profiles(id),
  rejected_reason   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index profiles_status_idx on profiles (status);
create index profiles_role_idx on profiles (role);

-- Auto-create a profile row when a Supabase auth user is created.
-- role / full_name / slug are passed via raw_user_meta_data at signup.
-- New signups default to status 'pending'; admins are seeded directly.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, slug)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'stakeholder'),
    nullif(new.raw_user_meta_data ->> 'slug', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- The trigger runs as the table owner regardless of EXECUTE grants, so revoke
-- direct RPC access to the SECURITY DEFINER function from API roles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- RLS: users can read/update only their own profile. All privileged reads and
-- writes (listing pending users, approving) go through service-role API routes,
-- which bypass RLS -- mirroring how submissions/otp_codes are already accessed.
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
