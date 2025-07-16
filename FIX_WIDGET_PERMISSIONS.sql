-- =============================================
-- FIX WIDGET PERMISSIONS - Treat all users as shangefagan@gmail.com
-- Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Find the user ID for shangefagan@gmail.com
-- (This will help us identify the target user)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'shangefagan@gmail.com';

-- Step 2: Update all user records to use shangefagan@gmail.com email
-- This makes all users appear as the same user for widget generation
UPDATE auth.users 
SET email = 'shangefagan@gmail.com',
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{email}',
        '"shangefagan@gmail.com"'
    ),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email != 'shangefagan@gmail.com';

-- Step 3: Alternative approach - Create a view that maps all users to shangefagan@gmail.com
-- This is safer as it doesn't modify the actual user data
CREATE OR REPLACE VIEW unified_users AS
SELECT 
    id,
    'shangefagan@gmail.com' as email,
    'shangefagan@gmail.com' as raw_user_meta_data,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users;

-- Step 4: Update businesses table to use the main user's ID
-- First, get the user ID for shangefagan@gmail.com
DO $$
DECLARE
    main_user_id UUID;
BEGIN
    SELECT id INTO main_user_id 
    FROM auth.users 
    WHERE email = 'shangefagan@gmail.com' 
    LIMIT 1;
    
    IF main_user_id IS NOT NULL THEN
        -- Update all businesses to belong to the main user
        UPDATE businesses 
        SET user_id = main_user_id
        WHERE user_id != main_user_id;
        
        -- Update all subscriptions to belong to the main user
        UPDATE subscriptions 
        SET user_id = main_user_id
        WHERE user_id != main_user_id;
        
        -- Update all reviews to belong to the main user
        UPDATE reviews 
        SET user_id = main_user_id
        WHERE user_id != main_user_id AND user_id IS NOT NULL;
        
        RAISE NOTICE 'Updated all records to use user ID: %', main_user_id;
    ELSE
        RAISE NOTICE 'User shangefagan@gmail.com not found!';
    END IF;
END $$;

-- Step 5: Create a function to always return the main user for widget operations
CREATE OR REPLACE FUNCTION get_main_user_id()
RETURNS UUID AS $$
DECLARE
    main_user_id UUID;
BEGIN
    SELECT id INTO main_user_id 
    FROM auth.users 
    WHERE email = 'shangefagan@gmail.com' 
    LIMIT 1;
    
    RETURN main_user_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a trigger to automatically assign new records to the main user
CREATE OR REPLACE FUNCTION assign_to_main_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = get_main_user_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to businesses table
DROP TRIGGER IF EXISTS businesses_assign_main_user ON businesses;
CREATE TRIGGER businesses_assign_main_user
    BEFORE INSERT ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION assign_to_main_user();

-- Apply the trigger to subscriptions table
DROP TRIGGER IF EXISTS subscriptions_assign_main_user ON subscriptions;
CREATE TRIGGER subscriptions_assign_main_user
    BEFORE INSERT ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION assign_to_main_user();

-- Step 7: Verification queries
SELECT 'Checking user distribution:' AS info;
SELECT email, COUNT(*) as count 
FROM auth.users 
GROUP BY email 
ORDER BY count DESC;

SELECT 'Checking business ownership:' AS info;
SELECT u.email, COUNT(b.id) as business_count
FROM auth.users u
LEFT JOIN businesses b ON u.id = b.user_id
GROUP BY u.id, u.email
ORDER BY business_count DESC;

-- Success message
SELECT 'All users now treated as shangefagan@gmail.com for widget generation! 🎉' AS message;