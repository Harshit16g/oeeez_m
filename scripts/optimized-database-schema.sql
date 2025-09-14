-- Enhanced database schema with performance optimizations
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS artist_availability CASCADE;

-- Create optimized enum types
CREATE TYPE user_role AS ENUM ('event_planner', 'artist_manager', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system', 'reminder');
CREATE TYPE artist_availability AS ENUM ('available', 'busy', 'unavailable');

-- Enhanced users table with better structure
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'event_planner',
  verified BOOLEAN DEFAULT false,
  phone TEXT,
  bio TEXT,
  location TEXT,
  company TEXT,
  -- Simplified onboarding tracking
  is_onboarded BOOLEAN DEFAULT false,
  -- Enhanced preferences with better structure
  preferences JSONB DEFAULT jsonb_build_object(
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
    'timezone', 'UTC'
  ),
  -- Add search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(bio, '') || ' ' || coalesce(location, ''))
  ) STORED,
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);

-- Enhanced artists table with better performance
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE GENERATED ALWAYS AS (
    lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  ) STORED,
  image_url TEXT,
  genre TEXT NOT NULL,
  location TEXT NOT NULL,
  availability artist_availability DEFAULT 'available',
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  events_count INTEGER DEFAULT 0 CHECK (events_count >= 0),
  price INTEGER NOT NULL CHECK (price > 0),
  bio TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  duration TEXT,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Performance tracking
  response_time_hours INTEGER DEFAULT 24,
  cancellation_rate DECIMAL(3,2) DEFAULT 0.00,
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(name, '') || ' ' || 
      coalesce(genre, '') || ' ' || 
      coalesce(location, '') || ' ' || 
      coalesce(bio, '') || ' ' ||
      array_to_string(specialties, ' ')
    )
  ) STORED,
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced bookings table with better tracking
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  -- Event details
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  duration TEXT NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT,
  expected_guests TEXT NOT NULL,
  budget TEXT NOT NULL,
  status booking_status DEFAULT 'pending',
  amount INTEGER NOT NULL CHECK (amount > 0),
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  additional_requirements TEXT,
  -- Enhanced tracking
  booking_reference TEXT UNIQUE GENERATED ALWAYS AS (
    'BK-' || EXTRACT(YEAR FROM created_at) || '-' || 
    LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' ||
    SUBSTRING(id::TEXT, 1, 8)
  ) STORED,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  -- Payment tracking
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  commission_rate DECIMAL(3,2) DEFAULT 0.10,
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  -- Enhanced metadata
  metadata JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  expires_at TIMESTAMPTZ,
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_location ON users(location);
CREATE INDEX CONCURRENTLY idx_users_search ON users USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_users_updated_at ON users(updated_at);

CREATE INDEX CONCURRENTLY idx_artists_genre ON artists(genre);
CREATE INDEX CONCURRENTLY idx_artists_location ON artists(location);
CREATE INDEX CONCURRENTLY idx_artists_availability ON artists(availability);
CREATE INDEX CONCURRENTLY idx_artists_rating ON artists(rating DESC);
CREATE INDEX CONCURRENTLY idx_artists_price ON artists(price);
CREATE INDEX CONCURRENTLY idx_artists_manager_id ON artists(manager_id);
CREATE INDEX CONCURRENTLY idx_artists_search ON artists USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_artists_slug ON artists(slug);

CREATE INDEX CONCURRENTLY idx_bookings_user_id ON bookings(user_id);
CREATE INDEX CONCURRENTLY idx_bookings_artist_id ON bookings(artist_id);
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);
CREATE INDEX CONCURRENTLY idx_bookings_event_date ON bookings(event_date);
CREATE INDEX CONCURRENTLY idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX CONCURRENTLY idx_bookings_reference ON bookings(booking_reference);

CREATE INDEX CONCURRENTLY idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX CONCURRENTLY idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_artists_location_genre ON artists(location, genre);
CREATE INDEX CONCURRENTLY idx_artists_availability_rating ON artists(availability, rating DESC);
CREATE INDEX CONCURRENTLY idx_bookings_user_status_date ON bookings(user_id, status, event_date);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enhanced RLS policies with better performance
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "artists_select_available" ON artists FOR SELECT USING (
  availability = 'available' OR 
  manager_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "artists_manage_own" ON artists FOR ALL USING (
  manager_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (
  user_id = auth.uid() OR
  artist_id IN (SELECT id FROM artists WHERE manager_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE USING (
  user_id = auth.uid() OR
  artist_id IN (SELECT id FROM artists WHERE manager_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT WITH CHECK (true);

-- Create materialized view for artist statistics
CREATE MATERIALIZED VIEW artist_stats AS
SELECT 
  a.id,
  a.name,
  a.rating,
  a.reviews_count,
  a.events_count,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  AVG(CASE WHEN b.status = 'completed' THEN b.amount END) as avg_booking_amount,
  MAX(b.created_at) as last_booking_date
FROM artists a
LEFT JOIN bookings b ON a.id = b.artist_id
GROUP BY a.id, a.name, a.rating, a.reviews_count, a.events_count;

CREATE UNIQUE INDEX idx_artist_stats_id ON artist_stats(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_artist_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
