-- 1. ADD MISSING COLUMNS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_passcode TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. DISABLE RLS ON ALL TABLES
-- Since you are using Firebase for Auth, Supabase RLS will block all your requests
-- unless you disable it or configure a complex JWT bridge.
-- For "Firebase for Login Only" setup, disabling RLS is the standard way to proceed.

ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. ENSURE YOU HAVE A PROFILE (REPAIR SCRIPT)
-- If you are seeing "Profile not found", run this with your email and firebase UID
-- INSERT INTO profiles (id, email, full_name, role) 
-- VALUES ('YOUR_FIREBASE_UID', 'abhi.kush047@gmail.com', 'Abhi Kushwaha', 'owner')
-- ON CONFLICT (id) DO UPDATE SET email = 'abhi.kush047@gmail.com';
