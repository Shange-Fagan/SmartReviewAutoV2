-- =============================================
-- SIMPLE WIDGET FIX - Make all users act as shangefagan@gmail.com
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Update all users to have the same email (Quick & Direct)
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

-- Option 2: Update all business records to belong to the main user
DO $$
DECLARE
    main_user_id UUID;
BEGIN
    -- Get the main user ID
    SELECT id INTO main_user_id 
    FROM auth.users 
    WHERE email = 'shangefagan@gmail.com' 
    LIMIT 1;
    
    -- Update all businesses to belong to main user
    UPDATE businesses SET user_id = main_user_id;
    
    -- Update all subscriptions to belong to main user
    UPDATE subscriptions SET user_id = main_user_id;
    
    -- Update all reviews to belong to main user
    UPDATE reviews SET user_id = main_user_id WHERE user_id IS NOT NULL;
    
    RAISE NOTICE 'All records now belong to: %', main_user_id;
END $$;

-- Verify the fix
SELECT 'Current user distribution:' AS status;
SELECT email, COUNT(*) as user_count 
FROM auth.users 
GROUP BY email;

SELECT 'Widget generation should now work for all users! 🎉' AS message;