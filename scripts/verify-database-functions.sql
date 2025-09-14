-- Test the complete_user_onboarding function
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    function_exists BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'complete_user_onboarding'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'complete_user_onboarding function exists ✓';
    ELSE
        RAISE EXCEPTION 'complete_user_onboarding function does not exist ✗';
    END IF;
    
    -- Check if handle_new_user function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'handle_new_user function exists ✓';
    ELSE
        RAISE EXCEPTION 'handle_new_user function does not exist ✗';
    END IF;
    
    -- Check if handle_user_verification function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_user_verification'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'handle_user_verification function exists ✓';
    ELSE
        RAISE EXCEPTION 'handle_user_verification function does not exist ✗';
    END IF;
    
    -- Check if check_user_onboarding function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_user_onboarding'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'check_user_onboarding function exists ✓';
    ELSE
        RAISE EXCEPTION 'check_user_onboarding function does not exist ✗';
    END IF;
    
    RAISE NOTICE 'All database functions verified successfully! ✓';
END $$;

-- Test RLS policies
DO $$
BEGIN
    -- Check if users table has RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'users' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE 'Users table RLS enabled ✓';
    ELSE
        RAISE EXCEPTION 'Users table RLS not enabled ✗';
    END IF;
    
    -- Check if notifications table has RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'notifications' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE 'Notifications table RLS enabled ✓';
    ELSE
        RAISE EXCEPTION 'Notifications table RLS not enabled ✗';
    END IF;
    
    RAISE NOTICE 'All RLS policies verified successfully! ✓';
END $$;
