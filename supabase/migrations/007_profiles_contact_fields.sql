-- Persist contact details captured at signup on the profile.
-- mobile is required at signup; region/organization are optional.
alter table public.profiles add column if not exists mobile text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists organization text;

-- Extend the signup trigger to copy the new fields from auth metadata.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, slug, mobile, region, organization)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'stakeholder'),
    nullif(new.raw_user_meta_data ->> 'slug', ''),
    nullif(new.raw_user_meta_data ->> 'mobile', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(new.raw_user_meta_data ->> 'organization', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
