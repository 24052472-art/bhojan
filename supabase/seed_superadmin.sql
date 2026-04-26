-- Robust SQL to create the Super Admin user
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  user_id UUID := uuid_generate_v4();
  user_email TEXT := 'abhi.kush047@gmail.com';
  user_password TEXT := 'Gungun@1';
BEGIN
  -- Delete existing user to ensure clean slate
  -- This also cascade deletes from auth.identities and public.profiles
  DELETE FROM auth.users WHERE email = user_email;

  -- Insert into auth.users with all required fields for Supabase Auth
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin","role":"super_admin"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  -- Ensure identities table is also populated
  -- provider_id is required and should be the user_id for email provider
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id, -- Added this
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    uuid_generate_v4(), -- Identity needs its own UUID
    user_id,
    format('{"sub":"%s","email":"%s"}', user_id, user_email)::jsonb,
    'email',
    user_id, -- Using user_id as provider_id for email
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'Super Admin user created with correct authentication metadata.';
END $$;
