-- SQL to promote a user to Super Admin
-- Execute this in your Supabase SQL Editor

UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'aalokkushwaha285@gmail.com'
);

-- If the profile doesn't exist yet (user hasn't signed up), 
-- you can manually insert it once they sign up, 
-- or use this script after their first login.
