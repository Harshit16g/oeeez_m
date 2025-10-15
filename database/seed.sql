-- ============================================================================
-- OEEEZ MARKETPLACE SEED DATA
-- ============================================================================
-- Initial data to populate the database for testing and development
-- Run this after schema.sql
-- ============================================================================

-- ============================================================================
-- 1. SEED CATEGORIES
-- ============================================================================

INSERT INTO public.categories (name, slug, description, icon, display_order, provider_count, search_count, is_active) VALUES
-- Main categories
('Performing Arts', 'performing-arts', 'Musicians, DJs, bands, dancers, and live performers', '🎭', 1, 150, 1250, TRUE),
('Visual Arts', 'visual-arts', 'Photographers, videographers, graphic designers', '🎨', 2, 230, 980, TRUE),
('Event Services', 'event-services', 'Planners, caterers, decorators, and event coordinators', '🎉', 3, 180, 1450, TRUE),
('Digital Services', 'digital-services', 'Web developers, app developers, digital marketers', '💻', 4, 320, 2100, TRUE),
('Writing & Content', 'writing-content', 'Writers, copywriters, editors, content creators', '✍️', 5, 190, 750, TRUE),
('Consulting', 'consulting', 'Business consultants, career coaches, strategic advisors', '💼', 6, 145, 620, TRUE),
('Home Services', 'home-services', 'Cleaning, repairs, maintenance, and home improvement', '🏠', 7, 280, 1680, TRUE),
('Wellness & Fitness', 'wellness-fitness', 'Personal trainers, yoga instructors, nutritionists', '🧘', 8, 210, 1320, TRUE),
('Education & Tutoring', 'education-tutoring', 'Teachers, tutors, online instructors, mentors', '📚', 9, 165, 890, TRUE),
('Beauty & Fashion', 'beauty-fashion', 'Makeup artists, hair stylists, fashion consultants', '💄', 10, 175, 1120, TRUE),
('Automotive', 'automotive', 'Car repair, detailing, maintenance services', '🚗', 11, 95, 540, TRUE),
('Pet Services', 'pet-services', 'Pet grooming, training, sitting, and veterinary', '🐾', 12, 120, 680, TRUE),
('Legal & Finance', 'legal-finance', 'Lawyers, accountants, financial planners', '⚖️', 13, 85, 450, TRUE),
('Real Estate', 'real-estate', 'Real estate agents, property management', '🏘️', 14, 110, 720, TRUE),
('Crafts & Handmade', 'crafts-handmade', 'Artisans, crafters, custom makers', '🎁', 15, 200, 870, TRUE);

-- Get the IDs for subcategories
DO $$
DECLARE
  performing_arts_id INTEGER;
  visual_arts_id INTEGER;
  event_services_id INTEGER;
BEGIN
  SELECT id INTO performing_arts_id FROM public.categories WHERE slug = 'performing-arts';
  SELECT id INTO visual_arts_id FROM public.categories WHERE slug = 'visual-arts';
  SELECT id INTO event_services_id FROM public.categories WHERE slug = 'event-services';
  
  -- Subcategories for Performing Arts
  INSERT INTO public.categories (name, slug, description, parent_category_id, is_active) VALUES
  ('Musicians', 'musicians', 'Live music performers', performing_arts_id, TRUE),
  ('DJs', 'djs', 'Professional DJs for events', performing_arts_id, TRUE),
  ('Dancers', 'dancers', 'Dance performers and choreographers', performing_arts_id, TRUE),
  ('Bands', 'bands', 'Musical bands for events', performing_arts_id, TRUE);
  
  -- Subcategories for Visual Arts
  INSERT INTO public.categories (name, slug, description, parent_category_id, is_active) VALUES
  ('Photographers', 'photographers', 'Professional photography services', visual_arts_id, TRUE),
  ('Videographers', 'videographers', 'Video production and filming', visual_arts_id, TRUE),
  ('Graphic Designers', 'graphic-designers', 'Visual design and branding', visual_arts_id, TRUE);
  
  -- Subcategories for Event Services
  INSERT INTO public.categories (name, slug, description, parent_category_id, is_active) VALUES
  ('Event Planners', 'event-planners', 'Full-service event planning', event_services_id, TRUE),
  ('Caterers', 'caterers', 'Food and beverage services', event_services_id, TRUE),
  ('Decorators', 'decorators', 'Event decoration and setup', event_services_id, TRUE);
END $$;

-- ============================================================================
-- 2. SEED CATEGORY TAGS
-- ============================================================================

INSERT INTO public.category_tags (category_id, tag_name)
SELECT c.id, tag
FROM public.categories c
CROSS JOIN LATERAL (
  VALUES 
    ('trending'), ('popular'), ('featured'), ('new'),
    ('recommended'), ('top-rated'), ('verified')
) AS tags(tag)
WHERE c.parent_category_id IS NULL  -- Only main categories
  AND RANDOM() < 0.3  -- 30% chance for each tag
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. SEED SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- ============================================================================

-- Note: In production, users will be created through Supabase Auth
-- This is just for testing purposes

-- Sample booking statuses for demonstration
COMMENT ON TABLE public.bookings IS 'Bookings can have statuses: pending, confirmed, in_progress, completed, cancelled, rejected, refunded, disputed';

-- Sample payment methods
COMMENT ON TABLE public.payments IS 'Supported payment methods: credit_card, debit_card, paypal, stripe, bank_transfer, wallet, cash, other';

-- ============================================================================
-- 4. INITIALIZE TRENDING CACHE
-- ============================================================================

-- Initialize trending cache for current week
INSERT INTO public.trending_cache (entity_type, entity_id, search_count, view_count, booking_count, trending_score, period, period_start, period_end)
SELECT 
  'category',
  id,
  search_count,
  provider_count * 10 as view_count,  -- Approximate
  booking_count,
  (search_count * 0.4) + (provider_count * 10 * 0.3) + (booking_count * 0.3) as trending_score,
  'weekly',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE
FROM public.categories
WHERE parent_category_id IS NULL  -- Only main categories
  AND is_active = TRUE;

-- ============================================================================
-- 5. CREATE ADMIN USER (Optional - For development)
-- ============================================================================

-- Note: In production, create admin through Supabase Auth dashboard
-- Then update the user record with admin role

COMMENT ON TABLE public.users IS 'User roles: user, provider, admin, moderator. After creating user through Supabase Auth, update role manually.';

-- Example SQL to update user role (replace with actual user ID):
-- UPDATE public.users SET role = 'admin', user_type = 'both' WHERE email = 'admin@oeeez.online';

-- ============================================================================
-- 6. INITIAL SYSTEM CONFIGURATION
-- ============================================================================

-- Create a system configuration table (optional)
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description) VALUES
('platform_name', 'Oeeez', 'Platform display name'),
('platform_email', 'hello@oeeez.online', 'Platform contact email'),
('default_currency', 'USD', 'Default currency for transactions'),
('service_fee_percentage', '10', 'Platform service fee percentage'),
('min_booking_amount', '50', 'Minimum booking amount in default currency'),
('max_refund_days', '30', 'Maximum days for refund after booking'),
('review_grace_period_days', '14', 'Days after booking completion to leave review'),
('trending_update_frequency_hours', '1', 'How often to update trending cache'),
('notification_retention_days', '90', 'Days to keep notifications'),
('message_retention_days', '365', 'Days to keep messages'),
('max_upload_size_mb', '10', 'Maximum file upload size in MB'),
('maintenance_mode', 'false', 'Is platform in maintenance mode');

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

-- Verify data insertion
SELECT 
  'Categories' as table_name, 
  COUNT(*) as row_count 
FROM public.categories
UNION ALL
SELECT 
  'Category Tags', 
  COUNT(*) 
FROM public.category_tags
UNION ALL
SELECT 
  'Trending Cache', 
  COUNT(*) 
FROM public.trending_cache
UNION ALL
SELECT 
  'System Config', 
  COUNT(*) 
FROM public.system_config;
