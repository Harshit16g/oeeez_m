# Oeeez Marketplace Database

Complete database schema and documentation for the Oeeez multipurpose marketplace platform.

## Files

- **`schema.sql`** - Complete database schema with all tables, indexes, triggers, and RLS policies
- **`seed.sql`** - Initial seed data for categories and configuration
- **`DATABASE_DOCUMENTATION.md`** - Comprehensive documentation with ERD, table descriptions, and queries

## Quick Start

### 1. Set Up Database

```bash
# Create a new Supabase project or use existing database
# Install PostgreSQL 14+ with PostGIS extension (optional for geo features)
```

### 2. Run Schema

```bash
# Connect to your database
psql -U postgres -d oeeez_marketplace

# Run schema creation
\i schema.sql

# Run seed data
\i seed.sql
```

### 3. Configure Environment

```bash
# Copy .env.example to .env.local
cp ../.env.example ../.env.local

# Add your database credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Structure

### Core Entities

1. **Users** - User accounts and profiles (extends Supabase auth.users)
2. **Categories** - Marketplace categories with hierarchical support
3. **Provider Profiles** - Extended information for service providers
4. **Services** - Services offered by providers
5. **Bookings** - Customer bookings/orders
6. **Payments** - Transaction records
7. **Reviews** - Ratings and reviews
8. **Messages** - Secure messaging system
9. **Notifications** - Multi-channel notifications
10. **Search & Trending** - Analytics and trending algorithm

### Entity Relationships

```
Users ─┬─► Provider Profiles
       ├─► Provider Categories ◄─ Categories
       ├─► Services ◄─ Categories
       ├─► Bookings ◄─ Services
       ├─► Payments ◄─ Bookings
       ├─► Reviews ◄─ Bookings
       ├─► Conversations ◄─► Messages
       └─► Notifications
```

## Security Features

### Row Level Security (RLS)

All tables have RLS policies enabled:

- **Users**: Can view/update own profile; all profiles publicly viewable
- **Services**: Viewable by all; providers manage own services
- **Bookings**: Only visible to involved parties
- **Payments**: Only visible to payer/payee
- **Messages**: Only visible to conversation participants
- **Notifications**: Only visible to recipient

### Data Protection

- Automatic CASCADE deletes for orphaned records
- Soft deletion with `deleted_at` timestamps
- Audit trails for payments and sensitive operations
- CHECK constraints for data validation
- Email validation patterns

## Key Features

### Trending Algorithm

Tracks search queries and calculates trending scores based on:
- Search frequency (40%)
- View count (30%)
- Booking count (30%)

Updated periodically via `trending_cache` table.

### Messaging System

- One-to-one conversations
- Support for text, images, and files
- Read receipts and timestamps
- Soft delete for privacy

### Booking Workflow

```
pending → confirmed → in_progress → completed
                  ↓
              cancelled/rejected
```

Payment status tracked separately:
```
unpaid → pending → paid
              ↓
          refunded/failed
```

### Automatic Features

1. **Booking Numbers**: Auto-generated (BK-YYYYMMDD-######)
2. **Updated Timestamps**: Automatic on record updates
3. **Statistics**: Provider ratings and booking counts
4. **Notifications**: Trigger on booking/payment events

## Indexes for Performance

Optimized indexes on:
- Foreign keys for JOIN operations
- Frequently filtered columns (status, user_type, category)
- Time-based queries (created_at, booking_date)
- Search columns (email, slug, query_text)
- Trending calculations (search_count, rating)

## Maintenance Tasks

### Recommended Cron Jobs

```bash
# Update trending cache (every hour)
0 * * * * psql -d oeeez -c "SELECT update_trending_cache();"

# Clean expired notifications (daily)
0 2 * * * psql -d oeeez -c "DELETE FROM notifications WHERE expires_at < NOW();"

# Archive old conversations (weekly)
0 3 * * 0 psql -d oeeez -c "UPDATE conversations SET status='archived' WHERE last_message_at < NOW() - INTERVAL '6 months';"

# Calculate provider statistics (daily)
0 4 * * * psql -d oeeez -c "SELECT refresh_provider_stats();"
```

### Backup Strategy

- **Full Backup**: Daily at 2 AM UTC
- **Incremental**: Every 6 hours
- **Retention**: 30 days (production), 7 days (staging)
- **Point-in-Time Recovery**: Enabled

## Common Queries

### Get Trending Categories

```sql
SELECT c.*, tc.trending_score
FROM categories c
JOIN trending_cache tc ON c.id = tc.entity_id
WHERE tc.entity_type = 'category'
  AND tc.period = 'weekly'
ORDER BY tc.trending_score DESC
LIMIT 10;
```

### Get Provider Profile with Stats

```sql
SELECT 
  u.*, 
  pp.*,
  COUNT(DISTINCT b.id) as total_bookings,
  AVG(r.rating) as avg_rating
FROM users u
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
LEFT JOIN bookings b ON u.id = b.provider_id
LEFT JOIN reviews r ON u.id = r.reviewee_id
WHERE u.id = $1
GROUP BY u.id, pp.id;
```

### Get User Bookings

```sql
SELECT 
  b.*,
  provider.full_name as provider_name,
  s.title as service_title,
  p.status as payment_status
FROM bookings b
JOIN users provider ON b.provider_id = provider.id
LEFT JOIN services s ON b.service_id = s.id
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.client_id = $1
ORDER BY b.booking_date DESC;
```

## Migration from Existing Schema

If migrating from an existing database:

1. Export data from old schema
2. Create new database
3. Run `schema.sql`
4. Transform and import data
5. Verify foreign key relationships
6. Test RLS policies
7. Update application connection strings

See `DATABASE_DOCUMENTATION.md` for detailed migration guide.

## Troubleshooting

### Common Issues

**RLS Policy Blocking Queries**
```sql
-- Temporarily disable RLS for debugging (use with caution)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check active policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Slow Queries**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT ...;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) ASC;
```

**Foreign Key Violations**
```sql
-- Find orphaned records
SELECT * FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;
```

## Schema Version

**Current Version**: 1.0.0
**Last Updated**: 2025-10-14
**Compatible With**: PostgreSQL 14+, Supabase

## Support

- **Documentation**: `DATABASE_DOCUMENTATION.md`
- **Email**: dev@oeeez.online
- **Issues**: GitHub Issues

## License

Proprietary - Oeeez Marketplace Platform
