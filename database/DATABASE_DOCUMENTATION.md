# Oeeez Marketplace Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Oeeez Marketplace database schema. The schema is designed to support a multipurpose marketplace platform with secure, scalable, and efficient data management.

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Tables](#core-tables)
3. [Table Descriptions](#table-descriptions)
4. [Security Model](#security-model)
5. [Data Flow](#data-flow)
6. [Common Queries](#common-queries)

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   auth.users│◄────────│  public.users    │────────►│  categories │
└─────────────┘         └──────────────────┘         └─────────────┘
                                 │                           │
                                 │                           │
                        ┌────────┴────────┐                 │
                        │                 │                 │
                 ┌──────▼───────┐  ┌─────▼──────┐         │
                 │   provider_  │  │  provider_ │         │
                 │   profiles   │  │ categories │         │
                 └──────────────┘  └────────────┘         │
                        │                                  │
                        │         ┌────────────────────────┘
                        │         │
                 ┌──────▼─────────▼───┐
                 │     services       │
                 └────────────────────┘
                        │
                        │
                 ┌──────▼──────┐
                 │   bookings  │
                 └─────────────┘
                   │         │
         ┌─────────┴─┐   ┌───┴──────────┐
         │           │   │              │
    ┌────▼───┐  ┌───▼──────┐      ┌────▼────┐
    │payments│  │  reviews │      │messages │
    └────────┘  └──────────┘      └─────────┘
```

## Core Tables

### 1. Users (`public.users`)

Central user table extending Supabase auth.users with additional profile information.

**Key Features:**
- Dual role support (client/provider/both)
- Provider-specific fields (verification, skills, rates)
- Notification preferences
- Status tracking (active, suspended, deleted)
- Email validation constraint

**Indexes:**
- `idx_users_email`: Fast email lookups
- `idx_users_user_type`: Filter by user type
- `idx_users_status`: Active user queries
- `idx_users_created_at`: Time-based queries

### 2. Categories (`public.categories`)

Hierarchical category system supporting nested subcategories.

**Key Features:**
- Self-referencing parent-child relationships
- SEO metadata (meta_title, meta_description, keywords)
- Trending metrics (search_count, booking_count)
- Active/inactive status
- Display ordering

**Indexes:**
- `idx_categories_parent`: Subcategory queries
- `idx_categories_slug`: URL-friendly lookups
- `idx_categories_search_count`: Trending algorithm

### 3. Provider Profiles (`public.provider_profiles`)

Extended provider information beyond basic user data.

**Key Features:**
- Business information (name, type, registration)
- Portfolio management (JSONB array)
- Service areas and radius
- Working hours and timezone
- Statistics (ratings, bookings, response rate)
- Verification status (ID, address, background check)

### 4. Services (`public.services`)

Services offered by providers.

**Key Features:**
- Flexible pricing types (fixed, hourly, daily, project)
- Media support (images, videos)
- Requirements and deliverables
- Featured listings
- View/inquiry/booking tracking

### 5. Bookings (`public.bookings`)

Core booking/order system.

**Key Features:**
- Automatic booking number generation (BK-YYYYMMDD-######)
- Comprehensive location support (on_site, remote, venue)
- Detailed pricing breakdown (subtotal, fees, tax, discount)
- Status workflow (pending → confirmed → in_progress → completed)
- Payment status tracking
- Cancellation management

### 6. Payments (`public.payments`)

Payment transaction records.

**Key Features:**
- Multiple payment methods
- Gateway integration support (Stripe, PayPal, etc.)
- Transaction tracking
- Refund management
- Payment history log

### 7. Reviews (`public.reviews`)

Rating and review system.

**Key Features:**
- 5-star rating system
- Detailed ratings (quality, communication, professionalism, value)
- Verified purchase badges
- Provider responses
- Helpful votes
- One review per booking constraint

### 8. Messaging (`public.conversations` & `public.messages`)

Secure communication between users.

**Key Features:**
- One-to-one conversations
- Message types (text, image, file, system)
- Read status tracking
- Attachment support (JSONB)
- Soft deletion

### 9. Notifications (`public.notifications`)

Multi-channel notification system.

**Key Features:**
- Type-based notifications (booking, payment, review, message, system)
- Related entity tracking
- Action buttons with URLs
- Multi-channel delivery (email, SMS, push)
- Expiration dates

### 10. Search & Trending (`public.search_queries` & `public.trending_cache`)

Analytics and trending algorithm support.

**Key Features:**
- Query tracking with filters
- Result click tracking
- Trending score calculation
- Time-period based cache (daily, weekly, monthly)
- IP and user agent logging

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with specific policies:

#### Users
- Users can view and update their own profile
- All profiles are publicly viewable

#### Services
- Everyone can view active services
- Providers can manage their own services

#### Bookings
- Users can only view bookings they're involved in
- Clients can create new bookings
- Both parties can update booking details

#### Payments
- Users can only view payments they're involved in

#### Reviews
- Everyone can view reviews
- Users can create reviews for completed bookings

#### Messages
- Users can only view their own conversations and messages
- Users can send messages in their conversations

#### Notifications
- Users can only view and update their own notifications

### Data Protection

1. **Cascade Deletes**: User deletion cascades to related records
2. **Soft Deletes**: Important entities have `deleted_at` timestamp
3. **Audit Trail**: Payment history tracks all status changes
4. **Constraints**: CHECK constraints enforce data validity
5. **Encryption**: Sensitive data should be encrypted at application level

## Data Flow

### Booking Flow

```
1. Client creates booking (status: pending)
2. Provider receives notification
3. Provider confirms booking (status: confirmed)
4. Client makes payment (payment_status: paid)
5. Booking date arrives (status: in_progress)
6. Service completed (status: completed)
7. Client leaves review
8. Provider responds to review
```

### Search Flow

```
1. User performs search
2. Query logged in search_queries
3. Category search_count incremented
4. Trending cache updated (via cron job)
5. Trending categories displayed on homepage
```

### Messaging Flow

```
1. User initiates contact
2. Conversation created (or existing found)
3. Message sent
4. Recipient receives notification
5. Message marked as read
6. Last message timestamp updated on conversation
```

## Common Queries

### Get Provider Profile with Statistics

```sql
SELECT 
  u.*,
  pp.*,
  COUNT(DISTINCT b.id) as total_bookings,
  AVG(r.rating) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews
FROM public.users u
LEFT JOIN public.provider_profiles pp ON u.id = pp.user_id
LEFT JOIN public.bookings b ON u.id = b.provider_id
LEFT JOIN public.reviews r ON u.id = r.reviewee_id
WHERE u.id = $1
GROUP BY u.id, pp.id;
```

### Get Trending Categories

```sql
SELECT 
  c.*,
  tc.trending_score,
  tc.search_count,
  tc.view_count
FROM public.categories c
INNER JOIN public.trending_cache tc ON c.id = tc.entity_id
WHERE tc.entity_type = 'category'
  AND tc.period = 'weekly'
  AND tc.period_start = CURRENT_DATE - INTERVAL '7 days'
ORDER BY tc.trending_score DESC
LIMIT 10;
```

### Get User Bookings with Details

```sql
SELECT 
  b.*,
  provider.full_name as provider_name,
  provider.avatar_url as provider_avatar,
  s.title as service_title,
  c.name as category_name,
  p.status as payment_status,
  p.amount as payment_amount
FROM public.bookings b
INNER JOIN public.users provider ON b.provider_id = provider.id
LEFT JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.categories c ON b.category_id = c.id
LEFT JOIN public.payments p ON b.id = p.booking_id
WHERE b.client_id = $1
ORDER BY b.booking_date DESC;
```

### Get Unread Messages Count

```sql
SELECT 
  c.id as conversation_id,
  COUNT(m.id) as unread_count
FROM public.conversations c
INNER JOIN public.messages m ON c.id = m.conversation_id
WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
  AND m.sender_id != $1
  AND m.is_read = FALSE
GROUP BY c.id;
```

## Maintenance

### Automatic Triggers

1. **updated_at**: Automatically updated on record changes
2. **booking_number**: Generated on booking creation

### Recommended Cron Jobs

1. **Update Trending Cache**: Run every hour to recalculate trending scores
2. **Clean Expired Notifications**: Delete notifications past expiration date
3. **Calculate Provider Statistics**: Update average ratings and response times
4. **Archive Old Conversations**: Move inactive conversations to archive

### Backup Strategy

1. **Full Backup**: Daily at 2 AM UTC
2. **Incremental Backup**: Every 6 hours
3. **Point-in-Time Recovery**: Enabled for critical tables
4. **Retention**: 30 days for production, 7 days for staging

## Future Enhancements

1. **Favorites/Wishlists**: Allow users to save preferred providers
2. **Packages/Bundles**: Group services into packages
3. **Recurring Bookings**: Support for regular scheduled services
4. **Wallet System**: Internal balance for faster transactions
5. **Referral Program**: Track referrals and rewards
6. **Geo-spatial Queries**: Use PostGIS for location-based searches
7. **Full-text Search**: Implement PostgreSQL FTS for better search

## Migration Guide

See `DATABASE_MIGRATION.md` for step-by-step migration instructions from existing schemas.

## Support

For database-related questions or issues:
- Email: dev@oeeez.online
- Documentation: https://docs.oeeez.online/database
- GitHub Issues: https://github.com/oeeez/oeeez-marketplace/issues
