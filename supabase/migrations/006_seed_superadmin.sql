-- Seed a super-admin account directly into Supabase Auth.
-- The password is bcrypt-hashed via pgcrypto. The on_auth_user_created trigger
-- creates the profile (role from metadata); we then promote it to approved.
create extension if not exists pgcrypto;

do $$
declare
  uid uuid;
begin
  if exists (select 1 from auth.users where email = 'super@prodigitality.net') then
    return; -- already seeded
  end if;

  uid := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'super@prodigitality.net', crypt('Admin123$', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin","full_name":"Super Admin"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid,
    jsonb_build_object('sub', uid::text, 'email', 'super@prodigitality.net', 'email_verified', true, 'phone_verified', false),
    'email', uid::text, now(), now(), now()
  );

  -- Promote the trigger-created profile to an approved, verified admin.
  update public.profiles
     set role = 'admin',
         status = 'approved',
         is_email_verified = true,
         full_name = 'Super Admin',
         approved_at = now(),
         updated_at = now()
   where id = uid;
end $$;
