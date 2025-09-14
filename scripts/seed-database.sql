-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view available artists" ON artists FOR SELECT USING (availability = 'available');
CREATE POLICY "Artist managers can manage their artists" ON artists FOR ALL USING (auth.uid() = manager_id);

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample artists
INSERT INTO artists (name, image_url, genre, location, availability, rating, reviews_count, events_count, price, bio, specialties, equipment, duration, manager_id) VALUES
('DJ Sonic', '/placeholder.svg?height=300&width=300', 'Electronic', 'Mumbai', 'available', 4.8, 127, 200, 25000, 'Energetic performer with 10+ years of experience in electronic music. Known for creating unforgettable dance experiences at corporate events, weddings, and festivals.', ARRAY['House Music', 'Techno', 'Progressive', 'Commercial'], ARRAY['Professional DJ Setup', 'Sound System', 'Lighting', 'Microphones'], '2-6 hours (flexible)', '00000000-0000-0000-0000-000000000000'),
('The Jazz Collective', '/placeholder.svg?height=300&width=300', 'Jazz', 'Delhi', 'available', 4.9, 89, 150, 45000, 'Sophisticated jazz ensemble perfect for upscale events, weddings, and corporate gatherings. Our smooth melodies create the perfect ambiance for any occasion.', ARRAY['Smooth Jazz', 'Swing', 'Bossa Nova', 'Contemporary Jazz'], ARRAY['Full Band Setup', 'Acoustic Instruments', 'Sound System'], '3-5 hours (with breaks)', '00000000-0000-0000-0000-000000000000'),
('Rock Fusion', '/placeholder.svg?height=300&width=300', 'Rock', 'Bangalore', 'busy', 4.7, 156, 180, 55000, 'High-energy rock band that brings the house down! Perfect for festivals, concerts, and events that need that extra punch of excitement.', ARRAY['Classic Rock', 'Alternative', 'Indie Rock', 'Fusion'], ARRAY['Full Band Equipment', 'Amplifiers', 'Drum Kit', 'Sound System'], '2-4 hours', '00000000-0000-0000-0000-000000000000'),
('Bollywood Beats', '/placeholder.svg?height=300&width=300', 'Bollywood', 'Mumbai', 'available', 4.6, 203, 250, 35000, 'Bringing the best of Bollywood music to your events! From classic hits to latest chartbusters, we know how to get everyone dancing.', ARRAY['Classic Bollywood', 'Modern Hits', 'Regional Music', 'Dance Numbers'], ARRAY['DJ Setup', 'Live Instruments', 'Sound System', 'Lighting'], '3-6 hours', '00000000-0000-0000-0000-000000000000'),
('Classical Strings', '/placeholder.svg?height=300&width=300', 'Classical', 'Chennai', 'available', 4.9, 67, 120, 40000, 'Elegant classical music ensemble specializing in Indian classical and fusion. Perfect for cultural events, weddings, and sophisticated gatherings.', ARRAY['Indian Classical', 'Fusion', 'Instrumental', 'Vocal'], ARRAY['Traditional Instruments', 'Sound System', 'Microphones'], '2-4 hours', '00000000-0000-0000-0000-000000000000'),
('Pop Sensation', '/placeholder.svg?height=300&width=300', 'Pop', 'Delhi', 'available', 4.5, 134, 190, 30000, 'Contemporary pop artist with a voice that captivates audiences. Perfect for modern events, corporate functions, and celebrations.', ARRAY['Contemporary Pop', 'Covers', 'Original Music', 'Acoustic Sets'], ARRAY['Vocal Setup', 'Acoustic Guitar', 'Sound System', 'Backing Tracks'], '2-3 hours', '00000000-0000-0000-0000-000000000000'),
('Folk Harmony', '/placeholder.svg?height=300&width=300', 'Folk', 'Jaipur', 'available', 4.8, 78, 95, 28000, 'Authentic folk music group celebrating India''s rich cultural heritage. Perfect for cultural events, festivals, and traditional celebrations.', ARRAY['Rajasthani Folk', 'Traditional Songs', 'Cultural Performances', 'Storytelling'], ARRAY['Traditional Instruments', 'Costumes', 'Sound System'], '2-4 hours', '00000000-0000-0000-0000-000000000000'),
('Electronic Vibes', '/placeholder.svg?height=300&width=300', 'Electronic', 'Pune', 'available', 4.7, 112, 160, 32000, 'Cutting-edge electronic music producer and performer. Specializing in creating immersive audio-visual experiences for modern events.', ARRAY['EDM', 'Ambient', 'Experimental', 'Live Production'], ARRAY['Electronic Setup', 'Controllers', 'Sound System', 'Visual Effects'], '3-5 hours', '00000000-0000-0000-0000-000000000000');
