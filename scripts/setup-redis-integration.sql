-- Redis Integration Setup Script
-- This script sets up database functions and triggers to work with Redis caching

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function to notify Redis of data changes
CREATE OR REPLACE FUNCTION notify_redis_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify application to invalidate Redis cache
  -- The application will listen for these notifications
  
  IF TG_OP = 'DELETE' THEN
    PERFORM pg_notify('cache_invalidation', json_build_object(
      'table', TG_TABLE_NAME,
      'operation', 'DELETE',
      'id', OLD.id,
      'user_id', CASE WHEN TG_TABLE_NAME = 'user_profiles' THEN OLD.id ELSE OLD.user_id END
    )::text);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM pg_notify('cache_invalidation', json_build_object(
      'table', TG_TABLE_NAME,
      'operation', 'UPDATE',
      'id', NEW.id,
      'user_id', CASE WHEN TG_TABLE_NAME = 'user_profiles' THEN NEW.id ELSE NEW.user_id END
    )::text);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM pg_notify('cache_invalidation', json_build_object(
      'table', TG_TABLE_NAME,
      'operation', 'INSERT',
      'id', NEW.id,
      'user_id', CASE WHEN TG_TABLE_NAME = 'user_profiles' THEN NEW.id ELSE NEW.user_id END
    )::text);
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cache invalidation on user_profiles
DROP TRIGGER IF EXISTS user_profiles_cache_invalidation ON user_profiles;
CREATE TRIGGER user_profiles_cache_invalidation
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION notify_redis_cache_invalidation();

-- Create triggers for cache invalidation on artists
DROP TRIGGER IF EXISTS artists_cache_invalidation ON artists;
CREATE TRIGGER artists_cache_invalidation
  AFTER INSERT OR UPDATE OR DELETE ON artists
  FOR EACH ROW EXECUTE FUNCTION notify_redis_cache_invalidation();

-- Create triggers for cache invalidation on bookings
DROP TRIGGER IF EXISTS bookings_cache_invalidation ON bookings;
CREATE TRIGGER bookings_cache_invalidation
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_redis_cache_invalidation();

-- Create triggers for cache invalidation on notifications
DROP TRIGGER IF EXISTS notifications_cache_invalidation ON notifications;
CREATE TRIGGER notifications_cache_invalidation
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_redis_cache_invalidation();

-- Create triggers for cache invalidation on reviews
DROP TRIGGER IF EXISTS reviews_cache_invalidation ON reviews;
CREATE TRIGGER reviews_cache_invalidation
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_redis_cache_invalidation();

-- Add session tracking columns to user_profiles if not exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ip_address INET,
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0;

-- Create function to update user login stats
CREATE OR REPLACE FUNCTION update_user_login_stats(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1,
    last_ip_address = COALESCE(p_ip_address, last_ip_address),
    session_count = COALESCE(session_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user dashboard stats (cached version)
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  artist_id UUID;
BEGIN
  -- Check if user is an artist
  SELECT id INTO artist_id FROM artists WHERE user_id = p_user_id;
  
  IF artist_id IS NOT NULL THEN
    -- Artist dashboard stats
    SELECT json_build_object(
      'type', 'artist',
      'totalBookings', (
        SELECT COUNT(*) FROM bookings WHERE artist_id = artist_id
      ),
      'pendingBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE artist_id = artist_id AND status = 'pending'
      ),
      'completedBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE artist_id = artist_id AND status = 'completed'
      ),
      'totalEarnings', (
        SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
        WHERE artist_id = artist_id AND status = 'completed'
      ),
      'averageRating', (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE artist_id = artist_id
      ),
      'totalReviews', (
        SELECT COUNT(*) FROM reviews WHERE artist_id = artist_id
      ),
      'thisMonthBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE artist_id = artist_id 
        AND created_at >= date_trunc('month', CURRENT_DATE)
      ),
      'thisMonthEarnings', (
        SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
        WHERE artist_id = artist_id 
        AND status = 'completed'
        AND created_at >= date_trunc('month', CURRENT_DATE)
      )
    ) INTO result;
  ELSE
    -- Client dashboard stats
    SELECT json_build_object(
      'type', 'client',
      'totalBookings', (
        SELECT COUNT(*) FROM bookings WHERE user_id = p_user_id
      ),
      'pendingBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE user_id = p_user_id AND status = 'pending'
      ),
      'completedBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE user_id = p_user_id AND status = 'completed'
      ),
      'totalSpent', (
        SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
        WHERE user_id = p_user_id AND status = 'completed'
      ),
      'thisMonthBookings', (
        SELECT COUNT(*) FROM bookings 
        WHERE user_id = p_user_id 
        AND created_at >= date_trunc('month', CURRENT_DATE)
      ),
      'thisMonthSpent', (
        SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
        WHERE user_id = p_user_id 
        AND status = 'completed'
        AND created_at >= date_trunc('month', CURRENT_DATE)
      )
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance with Redis caching
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_status ON bookings(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_month ON bookings(created_at) WHERE created_at >= date_trunc('month', CURRENT_DATE);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_artist_rating ON reviews(artist_id, rating);

-- Create function to clean up old notifications (for Redis optimization)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE read = true 
  AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete unread notifications older than 90 days
  DELETE FROM notifications 
  WHERE read = false 
  AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get popular artists (for caching)
CREATE OR REPLACE FUNCTION get_popular_artists(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  category TEXT,
  hourly_rate DECIMAL,
  rating DECIMAL,
  total_bookings BIGINT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.category,
    a.hourly_rate,
    COALESCE(AVG(r.rating), 0) as rating,
    COUNT(b.id) as total_bookings,
    up.full_name,
    up.avatar_url,
    up.bio
  FROM artists a
  LEFT JOIN user_profiles up ON a.user_id = up.id
  LEFT JOIN bookings b ON a.id = b.artist_id
  LEFT JOIN reviews r ON a.id = r.artist_id
  WHERE a.is_active = true
  GROUP BY a.id, a.user_id, a.category, a.hourly_rate, up.full_name, up.avatar_url, up.bio
  ORDER BY COUNT(b.id) DESC, AVG(r.rating) DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_login_stats(UUID, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_artists(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;

-- Create a scheduled job to clean up old notifications (if pg_cron is available)
-- This is optional and requires the pg_cron extension
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

COMMIT;
