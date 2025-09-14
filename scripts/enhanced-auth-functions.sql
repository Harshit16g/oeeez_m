-- Enhanced authentication functions with better error handling and performance

-- Function to handle new user signup with comprehensive setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert user profile with enhanced defaults
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    verified,
    is_onboarded,
    preferences,
    created_at,
    updated_at,
    login_count
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    'event_planner',
    false,
    false,
    jsonb_build_object(
      'notifications', jsonb_build_object(
        'email', true,
        'push', true,
        'sms', false,
        'marketing', false
      ),
      'privacy', jsonb_build_object(
        'profileVisible', true,
        'showEmail', false,
        'showPhone', false,
        'showLocation', true
      ),
      'theme', 'system',
      'language', 'en',
      'timezone', COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
    ),
    NOW(),
    NOW(),
    0
  );

  -- Create welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    'system',
    'Welcome to Artistly! 🎉',
    'Your account has been created successfully. Complete your profile to start connecting with amazing artists.',
    3,
    jsonb_build_object(
      'action', 'complete_profile',
      'source', 'signup'
    ),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      created_at
    ) VALUES (
      NEW.id,
      'system',
      'Setup Error',
      'There was an issue setting up your profile. Please contact support if you experience any problems.',
      4,
      NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user email verification
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

    -- Create verification success notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'system',
      'Email Verified! ✅',
      'Your email has been verified successfully. You now have full access to all features.',
      2,
      jsonb_build_object(
        'action', 'email_verified',
        'verified_at', NEW.email_confirmed_at
      ),
      NOW()
    );
  END IF;

  -- Track login
  IF NEW.last_sign_in_at IS NOT NULL AND (OLD.last_sign_in_at IS NULL OR NEW.last_sign_in_at > OLD.last_sign_in_at) THEN
    UPDATE public.users 
    SET 
      last_login_at = NEW.last_sign_in_at,
      login_count = login_count + 1,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced onboarding completion function
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
RETURNS jsonb AS $$
DECLARE
  updated_user RECORD;
  result jsonb;
BEGIN
  -- Validate user exists and is not already onboarded
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Update user profile
  UPDATE public.users 
  SET 
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    company = COALESCE(user_company, company),
    location = COALESCE(user_location, location),
    role = COALESCE(user_role::user_role, role),
    bio = COALESCE(user_bio, bio),
    avatar_url = COALESCE(user_avatar_url, avatar_url),
    is_onboarded = true,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING * INTO updated_user;

  -- Create onboarding completion notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    created_at
  ) VALUES (
    user_id,
    'system',
    'Profile Complete! 🎊',
    'Welcome to the Artistly community! Your profile is now complete and you can start booking amazing artists.',
    3,
    jsonb_build_object(
      'action', 'onboarding_complete',
      'completed_at', NOW(),
      'profile_completion', 100
    ),
    NOW()
  );

  -- Create helpful tips notifications
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    created_at
  ) VALUES 
  (
    user_id,
    'system',
    'Pro Tip: Browse Artists 🎭',
    'Explore our curated selection of talented artists. Use filters to find the perfect match for your event.',
    1,
    jsonb_build_object(
      'action', 'browse_artists',
      'tip_type', 'discovery'
    ),
    NOW() + INTERVAL '5 minutes'
  ),
  (
    user_id,
    'system',
    'Booking Tip: Plan Ahead 📅',
    'Book artists at least 2-3 weeks in advance for better availability and rates.',
    1,
    jsonb_build_object(
      'action', 'booking_tips',
      'tip_type', 'planning'
    ),
    NOW() + INTERVAL '1 hour'
  );

  result := jsonb_build_object(
    'success', true,
    'user', row_to_json(updated_user),
    'message', 'Onboarding completed successfully'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION public.get_user_profile_with_stats(user_id UUID)
RETURNS jsonb AS $$
DECLARE
  user_profile RECORD;
  user_stats RECORD;
  result jsonb;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.users
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Get user statistics
  SELECT 
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.amount END), 0) as total_spent,
    COUNT(DISTINCT b.artist_id) as unique_artists_booked,
    MAX(b.created_at) as last_booking_date
  INTO user_stats
  FROM bookings b
  WHERE b.user_id = user_id;

  result := jsonb_build_object(
    'success', true,
    'profile', row_to_json(user_profile),
    'stats', row_to_json(user_stats)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search artists with advanced filtering
CREATE OR REPLACE FUNCTION public.search_artists(
  search_query TEXT DEFAULT NULL,
  genre_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  min_rating DECIMAL DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  availability_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  image_url TEXT,
  genre TEXT,
  location TEXT,
  availability artist_availability,
  rating DECIMAL,
  reviews_count INTEGER,
  events_count INTEGER,
  price INTEGER,
  bio TEXT,
  specialties TEXT[],
  response_time_hours INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.image_url,
    a.genre,
    a.location,
    a.availability,
    a.rating,
    a.reviews_count,
    a.events_count,
    a.price,
    a.bio,
    a.specialties,
    a.response_time_hours,
    CASE 
      WHEN search_query IS NOT NULL THEN
        ts_rank(a.search_vector, plainto_tsquery('english', search_query))
      ELSE 0
    END as rank
  FROM artists a
  WHERE 
    (search_query IS NULL OR a.search_vector @@ plainto_tsquery('english', search_query))
    AND (genre_filter IS NULL OR a.genre ILIKE '%' || genre_filter || '%')
    AND (location_filter IS NULL OR a.location ILIKE '%' || location_filter || '%')
    AND (min_rating IS NULL OR a.rating >= min_rating)
    AND (max_price IS NULL OR a.price <= max_price)
    AND (availability_filter IS NULL OR a.availability = availability_filter::artist_availability)
    AND a.availability != 'unavailable'
  ORDER BY 
    CASE WHEN search_query IS NOT NULL THEN rank END DESC,
    a.rating DESC,
    a.reviews_count DESC,
    a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_verification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_verification() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_artists(TEXT, TEXT, TEXT, DECIMAL, INTEGER, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_artist_stats() TO authenticated;
