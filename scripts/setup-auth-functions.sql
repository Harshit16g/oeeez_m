-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    verified,
    onboarding_completed,
    is_onboarded,
    preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'event_planner',
    false,
    false,
    false,
    jsonb_build_object(
      'notifications', jsonb_build_object(
        'email', true,
        'push', true,
        'sms', false
      ),
      'privacy', jsonb_build_object(
        'profileVisible', true,
        'showEmail', false,
        'showPhone', false
      ),
      'theme', 'system'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user email verification
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Update user as verified when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users 
    SET 
      verified = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email verification
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_verification();

-- Create function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION public.check_user_onboarding(user_id UUID)
RETURNS boolean AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT is_onboarded, onboarding_completed 
  INTO user_record 
  FROM public.users 
  WHERE id = user_id;
  
  RETURN COALESCE(user_record.is_onboarded, user_record.onboarding_completed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete user onboarding
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  user_id UUID,
  user_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_company TEXT DEFAULT NULL,
  user_location TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL,
  user_bio TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    company = COALESCE(user_company, company),
    location = COALESCE(user_location, location),
    role = COALESCE(user_role::user_role, role),
    bio = COALESCE(user_bio, bio),
    avatar_url = COALESCE(user_avatar_url, avatar_url),
    onboarding_completed = true,
    is_onboarded = true,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Create welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    read,
    created_at
  ) VALUES (
    user_id,
    'system',
    'Welcome to Artistly!',
    'Your profile has been set up successfully. Start exploring amazing artists for your events.',
    false,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create sample notifications for new users
CREATE OR REPLACE FUNCTION public.create_sample_notifications(user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, read, created_at) VALUES
  (user_id, 'system', 'Welcome to Artistly!', 'Your account has been created successfully. Complete your profile to get started.', false, NOW()),
  (user_id, 'booking', 'Booking Tip', 'Book artists at least 2 weeks in advance for better availability and rates.', false, NOW() - INTERVAL '1 hour'),
  (user_id, 'system', 'Explore Artists', 'Check out our featured artists and find the perfect match for your next event.', false, NOW() - INTERVAL '2 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to be more specific
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications 
FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_verification() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_onboarding(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_sample_notifications(UUID) TO anon, authenticated;
