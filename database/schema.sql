-- ============================================================================
-- OEEEZ MARKETPLACE DATABASE SCHEMA
-- ============================================================================
-- Complete database schema for a multipurpose marketplace platform
-- Supports: Users, Providers, Categories, Bookings, Payments, Messaging, Reviews
-- Security: Row Level Security (RLS) policies for data protection
-- ============================================================================

-- ============================================================================
-- 1. CORE TABLES: Users & Authentication
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  
  -- User type and role
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'provider', 'both')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'provider', 'admin', 'moderator')),
  
  -- Provider-specific fields
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  provider_category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL, -- Primary category for providers
  hourly_rate DECIMAL(10,2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
  skills TEXT[] -- Array of skills
  
  -- Status and preferences
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted', 'pending')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_type ON public.users(user_type);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- 2. MARKETPLACE CATEGORIES
-- ============================================================================

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  image_url TEXT,
  
  -- Category metadata
  parent_category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Tracking fields
  provider_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0, -- For trending algorithm
  booking_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories (self-referencing)
CREATE INDEX idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_active ON public.categories(is_active);
CREATE INDEX idx_categories_search_count ON public.categories(search_count DESC); -- For trending

-- Category tags for flexible categorization
CREATE TABLE IF NOT EXISTS public.category_tags (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, tag_name)
);

-- ============================================================================
-- 3. PROVIDER PROFILES
-- ============================================================================

-- Provider profiles (additional info beyond users table)
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Business information
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('individual', 'company', 'agency', 'freelancer')),
  business_registration TEXT, -- Registration number
  tax_id TEXT,
  
  -- Portfolio
  portfolio_url TEXT,
  portfolio_items JSONB DEFAULT '[]'::JSONB, -- Array of portfolio items
  
  -- Service areas
  service_radius INTEGER, -- In kilometers
  service_locations TEXT[], -- Array of locations served
  
  -- Availability
  working_hours JSONB, -- {monday: {start: "09:00", end: "17:00"}, ...}
  time_zone TEXT DEFAULT 'UTC',
  
  -- Pricing
  minimum_booking_amount DECIMAL(10,2),
  cancellation_policy TEXT,
  refund_policy TEXT,
  
  -- Statistics
  total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0),
  completed_bookings INTEGER DEFAULT 0 CHECK (completed_bookings >= 0),
  cancelled_bookings INTEGER DEFAULT 0 CHECK (cancelled_bookings >= 0),
  average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating BETWEEN 0.00 AND 5.00),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  response_rate DECIMAL(5,2) DEFAULT 100.00 CHECK (response_rate BETWEEN 0.00 AND 100.00), -- Percentage
  average_response_time INTEGER CHECK (average_response_time IS NULL OR average_response_time >= 0), -- In minutes
  
  -- Verification
  id_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,
  background_check_completed BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_profiles_user_id ON public.provider_profiles(user_id);
CREATE INDEX idx_provider_profiles_rating ON public.provider_profiles(average_rating DESC);

-- Provider categories (many-to-many)
CREATE TABLE IF NOT EXISTS public.provider_categories (
  id SERIAL PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  experience_years INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, category_id)
);

CREATE INDEX idx_provider_categories_provider ON public.provider_categories(provider_id);
CREATE INDEX idx_provider_categories_category ON public.provider_categories(category_id);

-- ============================================================================
-- 4. SERVICES & OFFERINGS
-- ============================================================================

-- Services offered by providers
CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'daily', 'project', 'custom')),
  price DECIMAL(10,2) CHECK (price IS NULL OR price >= 0),
  price_min DECIMAL(10,2) CHECK (price_min IS NULL OR price_min >= 0), -- For price ranges
  price_max DECIMAL(10,2) CHECK (price_max IS NULL OR price_max >= 0),
  currency TEXT DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'), -- ISO 4217 format
  
  -- Service details
  duration INTEGER CHECK (duration IS NULL OR duration > 0), -- In minutes
  capacity INTEGER DEFAULT 1 CHECK (capacity > 0), -- Number of clients that can be served simultaneously
  
  CONSTRAINT chk_price_range CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
  
  -- Media
  image_urls TEXT[],
  video_url TEXT,
  
  -- Requirements
  requirements TEXT, -- What client needs to provide
  deliverables TEXT, -- What provider will deliver
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Statistics
  views_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, slug)
);

CREATE INDEX idx_services_provider ON public.services(provider_id);
CREATE INDEX idx_services_category ON public.services(category_id);
CREATE INDEX idx_services_active ON public.services(is_active);
CREATE INDEX idx_services_featured ON public.services(is_featured);

-- ============================================================================
-- 5. BOOKINGS & ORDERS
-- ============================================================================

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id SERIAL PRIMARY KEY,
  booking_number TEXT NOT NULL UNIQUE, -- Human-readable booking number
  
  -- Parties involved
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES public.services(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Booking details
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  
  -- Date and time
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration INTEGER, -- In minutes
  time_zone TEXT DEFAULT 'UTC',
  
  -- Location
  location_type TEXT CHECK (location_type IN ('on_site', 'remote', 'venue', 'client_location')),
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_country TEXT,
  venue_postal_code TEXT,
  venue_coordinates POINT, -- PostGIS point for mapping
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0.00,
  tax DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'completed', 
    'cancelled', 'rejected', 'refunded', 'disputed'
  )),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'pending', 'paid', 'partially_paid', 'refunded', 'failed'
  )),
  
  -- Additional info
  special_requests TEXT,
  cancellation_reason TEXT,
  cancellation_date TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Generate booking number automatically
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('bookings_id_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_number();

CREATE INDEX idx_bookings_client ON public.bookings(client_id);
CREATE INDEX idx_bookings_provider ON public.bookings(provider_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at DESC);

-- ============================================================================
-- 6. PAYMENTS & TRANSACTIONS
-- ============================================================================

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  
  -- Related entities
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'credit_card', 'debit_card', 'paypal', 'stripe', 
    'bank_transfer', 'wallet', 'cash', 'other'
  )),
  
  -- Payment gateway info
  gateway TEXT, -- stripe, paypal, razorpay, etc.
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  
  -- Additional info
  description TEXT,
  metadata JSONB,
  
  -- Refund info
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_payer ON public.payments(payer_id);
CREATE INDEX idx_payments_payee ON public.payments(payee_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Payment history (for tracking all payment state changes)
CREATE TABLE IF NOT EXISTS public.payment_history (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. REVIEWS & RATINGS
-- ============================================================================

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  
  -- Entities
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  
  -- Detailed ratings
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Response
  response TEXT,
  response_date TIMESTAMPTZ,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
  is_featured BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per booking
  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================================================
-- 8. MESSAGING & COMMUNICATIONS
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id SERIAL PRIMARY KEY,
  
  -- Participants
  participant1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Related entities
  booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- Conversation details
  subject TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  
  -- Last message info
  last_message_id INTEGER,
  last_message_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate conversations
  UNIQUE(participant1_id, participant2_id)
);

CREATE INDEX idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================================================
-- 9. NOTIFICATIONS
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN (
    'booking', 'payment', 'review', 'message', 
    'system', 'reminder', 'promotion'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  related_entity_type TEXT, -- booking, review, message, etc.
  related_entity_id INTEGER,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  
  -- Delivery channels
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  sent_via_push BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- 10. SEARCH & TRENDING
-- ============================================================================

-- Search queries (for trending algorithm)
CREATE TABLE IF NOT EXISTS public.search_queries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Search details
  query_text TEXT NOT NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  filters JSONB, -- Store filters used
  
  -- Results
  results_count INTEGER DEFAULT 0,
  clicked_result_id INTEGER, -- Which result was clicked
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For analytics
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX idx_search_queries_text ON public.search_queries(query_text);
CREATE INDEX idx_search_queries_category ON public.search_queries(category_id);
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at DESC);

-- Trending items cache
CREATE TABLE IF NOT EXISTS public.trending_cache (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('category', 'service', 'provider')),
  entity_id INTEGER NOT NULL,
  
  -- Metrics
  search_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  trending_score DECIMAL(10,2) DEFAULT 0.00,
  
  -- Time period
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, period, period_start)
);

CREATE INDEX idx_trending_cache_score ON public.trending_cache(trending_score DESC);
CREATE INDEX idx_trending_cache_period ON public.trending_cache(period, period_start DESC);

-- ============================================================================
-- 11. SUPPORT & HELP
-- ============================================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  
  -- User info
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'account', 'booking', 'payment', 'technical', 
    'complaint', 'suggestion', 'other'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
  )),
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- ============================================================================
-- 12. ADMIN & MODERATION
-- ============================================================================

-- Reports (for flagged content)
CREATE TABLE IF NOT EXISTS public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Reported entity
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'user', 'service', 'review', 'message', 'booking'
  )),
  entity_id INTEGER NOT NULL,
  
  -- Report details
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'fraud', 'harassment', 
    'copyright', 'other'
  )),
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'resolved', 'dismissed'
  )),
  
  -- Moderation
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  action_taken TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_entity ON public.reports(entity_type, entity_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

-- ============================================================================
-- 13. UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles viewable by all
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (TRUE);

-- Categories are public
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (is_active = TRUE);

-- Services policies
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Providers can manage their own services" ON public.services
  FOR ALL USING (auth.uid() = provider_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Clients can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Messages policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
