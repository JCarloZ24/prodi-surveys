-- Enumerators provide payout details at signup (how they get compensated).
alter table public.profiles add column if not exists payout_details jsonb;

-- Extend the signup trigger to copy payout_details from auth metadata.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, role, slug, mobile, region, organization, payout_details
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'stakeholder'),
    nullif(new.raw_user_meta_data ->> 'slug', ''),
    nullif(new.raw_user_meta_data ->> 'mobile', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(new.raw_user_meta_data ->> 'organization', ''),
    new.raw_user_meta_data -> 'payout_details'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
