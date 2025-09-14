-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add bookings_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bookings_count') THEN
        ALTER TABLE users ADD COLUMN bookings_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add upcoming_events column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'upcoming_events') THEN
        ALTER TABLE users ADD COLUMN upcoming_events INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_spent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_spent') THEN
        ALTER TABLE users ADD COLUMN total_spent INTEGER DEFAULT 0;
    END IF;
    
    -- Add favorite_artists column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'favorite_artists') THEN
        ALTER TABLE users ADD COLUMN favorite_artists TEXT[] DEFAULT '{}';
    END IF;
    
    RAISE NOTICE 'Database schema updated successfully!';
END $$;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS void AS $$
BEGIN
    -- Update bookings count
    UPDATE users SET bookings_count = (
        SELECT COUNT(*) FROM bookings WHERE user_id = users.id
    );
    
    -- Update upcoming events count
    UPDATE users SET upcoming_events = (
        SELECT COUNT(*) FROM bookings 
        WHERE user_id = users.id 
        AND status = 'confirmed' 
        AND event_date > CURRENT_DATE
    );
    
    -- Update total spent
    UPDATE users SET total_spent = (
        SELECT COALESCE(SUM(amount), 0) FROM bookings 
        WHERE user_id = users.id 
        AND status = 'completed'
    );
    
    RAISE NOTICE 'User stats updated successfully!';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats when bookings change
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS trigger AS $$
BEGIN
    -- Update stats for the affected user
    UPDATE users SET 
        bookings_count = (SELECT COUNT(*) FROM bookings WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        upcoming_events = (
            SELECT COUNT(*) FROM bookings 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND status = 'confirmed' 
            AND event_date > CURRENT_DATE
        ),
        total_spent = (
            SELECT COALESCE(SUM(amount), 0) FROM bookings 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND status = 'completed'
        )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_user_stats_on_booking_change ON bookings;
CREATE TRIGGER update_user_stats_on_booking_change
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- Initial stats update
SELECT update_user_stats();
