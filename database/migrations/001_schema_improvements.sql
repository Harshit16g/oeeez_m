-- ============================================================================
-- SCHEMA IMPROVEMENTS MIGRATION
-- ============================================================================
-- Fixes for Phase 2 completion:
-- 1. Ensure proper primary/foreign key constraints
-- 2. Add multi-dimensional ratings support
-- 3. Improve data normalization
-- 4. Add proper indexing
-- 5. Align with Redis cache structure
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Services table - frequently queried fields
CREATE INDEX IF NOT EXISTS idx_services_service_id ON public.services(id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_price_type ON public.services(price_type);

-- Reviews table - add missing indexes for queries
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_quality_rating ON public.reviews(quality_rating DESC) WHERE quality_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_communication_rating ON public.reviews(communication_rating DESC) WHERE communication_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_professionalism_rating ON public.reviews(professionalism_rating DESC) WHERE professionalism IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_value_rating ON public.reviews(value_rating DESC) WHERE value_rating IS NOT NULL;

-- Bookings table - add service_id index for queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date_status ON public.bookings(booking_date, status);

-- Users table - add index for skills array (GIN index for array search)
CREATE INDEX IF NOT EXISTS idx_users_skills ON public.users USING GIN (skills) WHERE skills IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_provider_category ON public.users(provider_category_id) WHERE provider_category_id IS NOT NULL;

-- ============================================================================
-- 2. ENSURE PROPER CONSTRAINTS AND NORMALIZATION
-- ============================================================================

-- Ensure reviews have proper NOT NULL constraints for core fields
ALTER TABLE public.reviews 
  ALTER COLUMN rating SET NOT NULL,
  ALTER COLUMN reviewer_id SET NOT NULL,
  ALTER COLUMN reviewee_id SET NOT NULL,
  ALTER COLUMN booking_id SET NOT NULL;

-- Ensure bookings have proper NOT NULL constraints
ALTER TABLE public.bookings
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN provider_id SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN booking_date SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL;

-- Ensure services have proper NOT NULL constraints
ALTER TABLE public.services
  ALTER COLUMN provider_id SET NOT NULL,
  ALTER COLUMN category_id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN price_type SET NOT NULL;

-- Add constraint to ensure at least one price field is set for services
ALTER TABLE public.services
  ADD CONSTRAINT chk_service_pricing CHECK (
    price IS NOT NULL OR 
    (price_min IS NOT NULL AND price_max IS NOT NULL) OR 
    price_type = 'custom'
  );

-- ============================================================================
-- 3. ADD COMPUTED COLUMNS AND FUNCTIONS FOR MULTI-DIMENSIONAL RATINGS
-- ============================================================================

-- Function to calculate average multi-dimensional rating
CREATE OR REPLACE FUNCTION calculate_average_multi_rating(
  p_quality INTEGER,
  p_communication INTEGER,
  p_professionalism INTEGER,
  p_value INTEGER
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_count INTEGER := 0;
  v_sum INTEGER := 0;
BEGIN
  IF p_quality IS NOT NULL THEN
    v_sum := v_sum + p_quality;
    v_count := v_count + 1;
  END IF;
  
  IF p_communication IS NOT NULL THEN
    v_sum := v_sum + p_communication;
    v_count := v_count + 1;
  END IF;
  
  IF p_professionalism IS NOT NULL THEN
    v_sum := v_sum + p_professionalism;
    v_count := v_count + 1;
  END IF;
  
  IF p_value IS NOT NULL THEN
    v_sum := v_sum + p_value;
    v_count := v_count + 1;
  END IF;
  
  IF v_count = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(v_sum::DECIMAL / v_count, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for average multi-dimensional rating
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS avg_multi_rating DECIMAL(3,2) 
  GENERATED ALWAYS AS (
    calculate_average_multi_rating(
      quality_rating,
      communication_rating,
      professionalism_rating,
      value_rating
    )
  ) STORED;

-- ============================================================================
-- 4. CREATE MATERIALIZED VIEW FOR AGGREGATED RATINGS
-- ============================================================================

-- Materialized view for service ratings aggregation (improves query performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.service_ratings_summary AS
SELECT 
  s.id AS service_id,
  s.provider_id,
  COUNT(r.id) AS total_reviews,
  COUNT(CASE WHEN r.is_verified THEN 1 END) AS verified_reviews,
  AVG(r.rating)::DECIMAL(3,2) AS avg_overall_rating,
  AVG(r.quality_rating)::DECIMAL(3,2) AS avg_quality_rating,
  AVG(r.communication_rating)::DECIMAL(3,2) AS avg_communication_rating,
  AVG(r.professionalism_rating)::DECIMAL(3,2) AS avg_professionalism_rating,
  AVG(r.value_rating)::DECIMAL(3,2) AS avg_value_rating,
  AVG(r.avg_multi_rating)::DECIMAL(3,2) AS avg_multi_dimensional_rating,
  SUM(r.helpful_count) AS total_helpful_votes,
  MAX(r.created_at) AS last_review_date
FROM public.services s
LEFT JOIN public.reviews r ON r.service_id = s.id
GROUP BY s.id, s.provider_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_ratings_summary_service_id 
  ON public.service_ratings_summary(service_id);
CREATE INDEX IF NOT EXISTS idx_service_ratings_summary_provider 
  ON public.service_ratings_summary(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_ratings_summary_avg_rating 
  ON public.service_ratings_summary(avg_overall_rating DESC NULLS LAST);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_service_ratings_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.service_ratings_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE REDIS CACHE ALIGNMENT FUNCTIONS
-- ============================================================================

-- Function to generate consistent cache keys for Redis
CREATE OR REPLACE FUNCTION get_cache_key(
  p_entity_type TEXT,
  p_entity_id TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN 'oeeez:' || p_entity_type || ':' || p_entity_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all related cache keys for a user (for invalidation)
CREATE OR REPLACE FUNCTION get_user_related_cache_keys(p_user_id UUID)
RETURNS TABLE(cache_key TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT get_cache_key('user:profile', p_user_id::TEXT)
  UNION ALL
  SELECT get_cache_key('user:bookings', p_user_id::TEXT)
  UNION ALL
  SELECT get_cache_key('user:reviews', p_user_id::TEXT)
  UNION ALL
  SELECT get_cache_key('user:services', p_user_id::TEXT)
  UNION ALL
  SELECT get_cache_key('provider:profile', p_user_id::TEXT);
END;
$$ LANGUAGE plpgsql;

-- Function to get all related cache keys for a service (for invalidation)
CREATE OR REPLACE FUNCTION get_service_related_cache_keys(p_service_id INTEGER)
RETURNS TABLE(cache_key TEXT) AS $$
DECLARE
  v_provider_id UUID;
BEGIN
  -- Get provider_id for this service
  SELECT provider_id INTO v_provider_id FROM public.services WHERE id = p_service_id;
  
  RETURN QUERY
  SELECT get_cache_key('service:detail', p_service_id::TEXT)
  UNION ALL
  SELECT get_cache_key('service:reviews', p_service_id::TEXT)
  UNION ALL
  SELECT get_cache_key('service:bookings', p_service_id::TEXT)
  UNION ALL
  SELECT get_cache_key('user:services', v_provider_id::TEXT)
  UNION ALL
  SELECT get_cache_key('category:services', 
    (SELECT category_id::TEXT FROM public.services WHERE id = p_service_id));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ADD TRIGGERS FOR CACHE INVALIDATION TRACKING
-- ============================================================================

-- Table to track cache invalidation events
CREATE TABLE IF NOT EXISTS public.cache_invalidation_log (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  cache_keys TEXT[], -- Array of cache keys to invalidate
  invalidated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ
);

CREATE INDEX idx_cache_invalidation_log_pending 
  ON public.cache_invalidation_log(created_at) 
  WHERE invalidated = FALSE;

-- Trigger function to log cache invalidation for reviews
CREATE OR REPLACE FUNCTION log_review_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.cache_invalidation_log (entity_type, entity_id, action, cache_keys)
    VALUES (
      'review',
      NEW.id::TEXT,
      lower(TG_OP),
      ARRAY(
        SELECT cache_key FROM get_service_related_cache_keys(NEW.service_id)
        UNION ALL
        SELECT get_cache_key('user:reviews', NEW.reviewee_id::TEXT)
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.cache_invalidation_log (entity_type, entity_id, action, cache_keys)
    VALUES (
      'review',
      OLD.id::TEXT,
      'delete',
      ARRAY(
        SELECT cache_key FROM get_service_related_cache_keys(OLD.service_id)
        UNION ALL
        SELECT get_cache_key('user:reviews', OLD.reviewee_id::TEXT)
      )
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to reviews table
DROP TRIGGER IF EXISTS review_cache_invalidation_trigger ON public.reviews;
CREATE TRIGGER review_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION log_review_cache_invalidation();

-- ============================================================================
-- 7. ADD DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Ensure booking dates are in the future (for new bookings)
ALTER TABLE public.bookings
  ADD CONSTRAINT chk_booking_date_valid CHECK (
    booking_date >= CURRENT_DATE OR status IN ('completed', 'cancelled', 'refunded')
  );

-- Ensure helpful votes are non-negative
ALTER TABLE public.reviews
  ADD CONSTRAINT chk_helpful_votes_positive CHECK (
    helpful_count >= 0 AND not_helpful_count >= 0
  );

-- Ensure start_time and end_time are consistent
ALTER TABLE public.bookings
  ADD CONSTRAINT chk_booking_time_valid CHECK (
    start_time IS NULL OR end_time IS NULL OR start_time < end_time
  );

-- ============================================================================
-- 8. CREATE HELPER VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active services with ratings
CREATE OR REPLACE VIEW public.services_with_ratings AS
SELECT 
  s.*,
  COALESCE(srs.total_reviews, 0) AS review_count,
  COALESCE(srs.avg_overall_rating, 0) AS avg_rating,
  COALESCE(srs.avg_quality_rating, 0) AS avg_quality,
  COALESCE(srs.avg_communication_rating, 0) AS avg_communication,
  COALESCE(srs.avg_professionalism_rating, 0) AS avg_professionalism,
  COALESCE(srs.avg_value_rating, 0) AS avg_value,
  u.full_name AS provider_name,
  u.avatar_url AS provider_avatar
FROM public.services s
LEFT JOIN public.service_ratings_summary srs ON srs.service_id = s.id
LEFT JOIN public.users u ON u.id = s.provider_id
WHERE s.is_active = TRUE;

-- View for booking history with user and service details
CREATE OR REPLACE VIEW public.bookings_detailed AS
SELECT 
  b.*,
  c.full_name AS client_name,
  c.email AS client_email,
  p.full_name AS provider_name,
  p.email AS provider_email,
  s.title AS service_title,
  s.price_type AS service_price_type,
  cat.name AS category_name
FROM public.bookings b
LEFT JOIN public.users c ON c.id = b.client_id
LEFT JOIN public.users p ON p.id = b.provider_id
LEFT JOIN public.services s ON s.id = b.service_id
LEFT JOIN public.categories cat ON cat.id = b.category_id;

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.reviews IS 'Stores user reviews with multi-dimensional ratings (quality, communication, professionalism, value)';
COMMENT ON COLUMN public.reviews.avg_multi_rating IS 'Computed average of all multi-dimensional ratings';
COMMENT ON COLUMN public.reviews.is_verified IS 'True if reviewer has completed a booking with the reviewee';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of users who found this review helpful';

COMMENT ON TABLE public.bookings IS 'Stores all marketplace bookings with full lifecycle tracking';
COMMENT ON COLUMN public.bookings.booking_number IS 'Human-readable unique booking reference (e.g., BK-20250115-000123)';
COMMENT ON COLUMN public.bookings.status IS 'Current booking status: pending, confirmed, in_progress, completed, cancelled, rejected, refunded, disputed';

COMMENT ON TABLE public.services IS 'Provider service offerings with pricing and availability';
COMMENT ON COLUMN public.services.price_type IS 'Pricing model: fixed, hourly, daily, project, or custom';

COMMENT ON MATERIALIZED VIEW public.service_ratings_summary IS 'Aggregated ratings for all services - refresh periodically for performance';

COMMENT ON FUNCTION get_cache_key(TEXT, TEXT) IS 'Generates consistent Redis cache keys in format: oeeez:{entity_type}:{entity_id}';
COMMENT ON FUNCTION refresh_service_ratings_summary() IS 'Refreshes the materialized view for service ratings - call after bulk review updates';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Schema improvements migration completed successfully';
  RAISE NOTICE 'Added indexes for: services, reviews, bookings, users';
  RAISE NOTICE 'Created materialized view: service_ratings_summary';
  RAISE NOTICE 'Added cache invalidation logging';
  RAISE NOTICE 'Created helper views: services_with_ratings, bookings_detailed';
END $$;
