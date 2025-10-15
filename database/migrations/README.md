# Database Migrations

This directory contains database schema migrations for the Oeeez Marketplace platform.

## Migration Files

### 001_schema_improvements.sql

**Purpose**: Phase 2 schema improvements and normalization

**Changes**:
1. **Indexing Improvements**
   - Added missing indexes on `services`, `reviews`, `bookings`, and `users` tables
   - GIN index on users.skills for array search
   - Composite indexes for common query patterns

2. **Constraint Enforcement**
   - Added NOT NULL constraints on critical foreign keys
   - Added CHECK constraints for data validation
   - Ensured referential integrity for all relationships

3. **Multi-dimensional Ratings**
   - Added `avg_multi_rating` computed column to reviews table
   - Created `calculate_average_multi_rating()` function
   - Supports quality, communication, professionalism, and value ratings

4. **Performance Optimization**
   - Created `service_ratings_summary` materialized view
   - Added indexes for efficient rating queries
   - Created `refresh_service_ratings_summary()` function

5. **Redis Cache Alignment**
   - Created `get_cache_key()` function for consistent cache key generation
   - Added `get_user_related_cache_keys()` and `get_service_related_cache_keys()` for cache invalidation
   - Created `cache_invalidation_log` table for tracking
   - Added triggers for automatic cache invalidation logging

6. **Helper Views**
   - `services_with_ratings`: Services with aggregated rating data
   - `bookings_detailed`: Bookings with user and service details

7. **Data Validation**
   - Booking date validation
   - Time range validation
   - Helpful votes validation
   - Service pricing validation

## Running Migrations

### Using psql (PostgreSQL command-line)

```bash
# Connect to your database
psql -U your_username -d your_database

# Run the migration
\i database/migrations/001_schema_improvements.sql
```

### Using Supabase CLI

```bash
# Push migration to Supabase
supabase db push

# Or apply specific migration
psql -h db.your-project.supabase.co -U postgres -d postgres < database/migrations/001_schema_improvements.sql
```

### Using Node.js/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

const migrationSQL = fs.readFileSync('database/migrations/001_schema_improvements.sql', 'utf-8')
await supabase.rpc('exec_sql', { sql: migrationSQL })
```

## Post-Migration Tasks

After running `001_schema_improvements.sql`:

1. **Refresh Materialized Views**
   ```sql
   SELECT refresh_service_ratings_summary();
   ```

2. **Verify Indexes**
   ```sql
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public'
   ORDER BY tablename, indexname;
   ```

3. **Check Constraints**
   ```sql
   SELECT conname, contype, conrelid::regclass 
   FROM pg_constraint 
   WHERE connamespace = 'public'::regnamespace;
   ```

4. **Test Cache Key Functions**
   ```sql
   -- Test cache key generation
   SELECT get_cache_key('service:detail', '123');
   
   -- Test related keys retrieval
   SELECT * FROM get_user_related_cache_keys('your-uuid-here');
   ```

## Integration with Redis Cache

The migration adds support for automatic cache invalidation tracking. When reviews are created/updated/deleted, the system logs which cache keys should be invalidated.

**Example workflow:**

1. User posts a review → Trigger fires → Cache invalidation log entry created
2. Background job reads `cache_invalidation_log` where `invalidated = FALSE`
3. Job invalidates Redis keys listed in `cache_keys` array
4. Job marks records as `invalidated = TRUE`

**Redis integration code** (lib/redis/cache-invalidation.ts):

```typescript
import { cache, CacheKeys } from '@/lib/redis'
import { supabase } from '@/lib/supabase'

export async function processCacheInvalidationQueue() {
  // Fetch pending invalidations
  const { data: pending } = await supabase
    .from('cache_invalidation_log')
    .select('*')
    .eq('invalidated', false)
    .order('created_at', { ascending: true })
    .limit(100)

  for (const entry of pending || []) {
    // Invalidate each cache key
    for (const key of entry.cache_keys) {
      await cache.delete(key)
    }

    // Mark as invalidated
    await supabase
      .from('cache_invalidation_log')
      .update({ invalidated: true, invalidated_at: new Date() })
      .eq('id', entry.id)
  }
}
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop created objects in reverse order
DROP VIEW IF EXISTS public.bookings_detailed;
DROP VIEW IF EXISTS public.services_with_ratings;
DROP TRIGGER IF EXISTS review_cache_invalidation_trigger ON public.reviews;
DROP FUNCTION IF EXISTS log_review_cache_invalidation();
DROP TABLE IF EXISTS public.cache_invalidation_log;
DROP FUNCTION IF EXISTS get_service_related_cache_keys(INTEGER);
DROP FUNCTION IF EXISTS get_user_related_cache_keys(UUID);
DROP FUNCTION IF EXISTS get_cache_key(TEXT, TEXT);
DROP FUNCTION IF EXISTS refresh_service_ratings_summary();
DROP MATERIALIZED VIEW IF EXISTS public.service_ratings_summary;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS avg_multi_rating;
DROP FUNCTION IF EXISTS calculate_average_multi_rating(INTEGER, INTEGER, INTEGER, INTEGER);

-- Remove constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_booking_time_valid;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS chk_helpful_votes_positive;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_booking_date_valid;
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS chk_service_pricing;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_provider_category;
DROP INDEX IF EXISTS idx_users_skills;
-- ... (continue for all created indexes)
```

## Best Practices

1. **Always backup** your database before running migrations
2. **Test migrations** on a staging environment first
3. **Run during low-traffic** periods for production
4. **Monitor performance** after adding indexes
5. **Refresh materialized views** regularly (e.g., hourly via cron)

## Support

For issues or questions about migrations:
- Check the main schema file: `database/schema.sql`
- Review the ARCHITECTURE.md document
- Open an issue on GitHub

---

**Last Updated**: Phase 2 Completion (October 2025)
