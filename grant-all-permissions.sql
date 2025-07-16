-- =============================================
-- GRANT ALL PERMISSIONS TO ALL USERS
-- Run this in your Supabase SQL Editor
-- =============================================

-- Option 1: Disable Row Level Security (RLS) completely
-- This gives everyone full access to everything
ALTER TABLE IF EXISTS businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policies (if you want to keep RLS enabled)
-- Uncomment these if you prefer to keep RLS but allow all operations

/*
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own widgets" ON widgets;
DROP POLICY IF EXISTS "Users can insert own widgets" ON widgets;
DROP POLICY IF EXISTS "Users can update own widgets" ON widgets;
DROP POLICY IF EXISTS "Users can delete own widgets" ON widgets;
DROP POLICY IF EXISTS "Public can view active widgets" ON widgets;

DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON reviews;

DROP POLICY IF EXISTS "Users can view own review requests" ON review_requests;
DROP POLICY IF EXISTS "Users can insert own review requests" ON review_requests;
DROP POLICY IF EXISTS "Users can update own review requests" ON review_requests;
DROP POLICY IF EXISTS "Users can delete own review requests" ON review_requests;

DROP POLICY IF EXISTS "Users can view own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON analytics;
DROP POLICY IF EXISTS "Anyone can track analytics" ON analytics;

-- Create super permissive policies that allow everything
CREATE POLICY "Allow all operations" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON widgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON review_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON analytics FOR ALL USING (true) WITH CHECK (true);
*/

-- Grant all permissions to authenticated and anonymous users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Create a function that can be called to grant all permissions
CREATE OR REPLACE FUNCTION grant_all_permissions()
RETURNS TEXT AS $$
BEGIN
    -- Disable RLS on all tables
    ALTER TABLE IF EXISTS businesses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS widgets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS review_requests DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;
    
    -- Grant all permissions
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
    
    RETURN 'All permissions granted successfully!';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT grant_all_permissions();

-- Success message
SELECT 'All users now have full permissions to all tables! 🎉' AS message;