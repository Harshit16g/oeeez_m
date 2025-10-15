# Redis Caching Layer

This directory contains the Redis caching implementation for the Oeeez Marketplace platform.

## Overview

The Redis caching layer provides session storage and query optimization to improve application performance and reduce database load.

## Features

- **Session Caching**: Store user sessions with automatic expiration
- **Query Result Caching**: Cache frequently accessed data (user profiles, bookings, notifications)
- **Graceful Degradation**: Application continues to work without Redis
- **Automatic Cache Invalidation**: Pattern-based cache invalidation
- **TTL Management**: Configurable time-to-live for different data types

## Setup

### Local Development

1. Install Redis:
   ```bash
   # macOS
   brew install redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Windows (use WSL or Redis for Windows)
   ```

2. Start Redis server:
   ```bash
   redis-server
   # or with custom config
   redis-server /path/to/redis.conf
   ```

3. Set environment variable:
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

### Production (Upstash Redis Cloud)

1. Create a free Redis database at [Upstash](https://upstash.com)
2. Copy the Redis URL from the dashboard
3. Set environment variable:
   ```bash
   REDIS_URL=rediss://default:your-token@your-endpoint.upstash.io:6379
   ```

## Usage

### Basic Cache Operations

```typescript
import { cache, CacheKeys, CacheTTL } from '@/lib/redis'

// Get cached data
const profile = await cache.get(CacheKeys.userProfile(userId))

// Set cached data
await cache.set(CacheKeys.userProfile(userId), profileData, CacheTTL.MEDIUM)

// Delete cached data
await cache.del(CacheKeys.userProfile(userId))

// Get or set pattern
const profile = await cache.getOrSet(
  CacheKeys.userProfile(userId),
  async () => {
    // Fetch from database
    return await fetchUserProfile(userId)
  },
  CacheTTL.MEDIUM
)
```

### Cache Keys

Predefined cache key generators ensure consistent naming:

- `CacheKeys.userProfile(userId)` - User profile data
- `CacheKeys.userSession(sessionId)` - User session data
- `CacheKeys.userBookings(userId)` - User bookings list
- `CacheKeys.userNotifications(userId)` - User notifications
- `CacheKeys.popularArtists()` - Popular artists list
- `CacheKeys.categoryProviders(slug)` - Providers by category
- `CacheKeys.dashboardStats(userId)` - Dashboard statistics
- `CacheKeys.userReviews(userId)` - User reviews
- `CacheKeys.serviceDetail(serviceId)` - Service details

### Cache TTL Values

Predefined TTL values for different data types:

- `CacheTTL.SHORT` (60s) - Frequently changing data
- `CacheTTL.MEDIUM` (5min) - Semi-static data
- `CacheTTL.LONG` (1hr) - Static data
- `CacheTTL.DAY` (24hr) - Rarely changing data

### Pattern-Based Invalidation

```typescript
// Invalidate all user-related caches
await cache.invalidatePattern('user:*')

// Invalidate all caches for a specific user
await cache.invalidatePattern(`user:*:${userId}`)
```

## Best Practices

1. **Always use predefined cache keys** to ensure consistency
2. **Choose appropriate TTL** based on data update frequency
3. **Invalidate cache** when data is updated
4. **Handle cache misses** gracefully by fetching from database
5. **Monitor cache hit rates** to optimize caching strategy

## Integration with Database

The Redis caching layer works seamlessly with the existing PostgreSQL database:

1. Database triggers notify cache invalidation (see `scripts/setup-redis-integration.sql`)
2. Application listens for PostgreSQL notifications
3. Relevant cache keys are invalidated automatically

## Monitoring

Monitor Redis performance using:

```bash
# Connect to Redis CLI
redis-cli

# Check memory usage
INFO memory

# Check cache hit rate
INFO stats

# View all keys (development only)
KEYS *

# Monitor commands in real-time
MONITOR
```

## Troubleshooting

### Redis Connection Issues

If Redis connection fails, check:

1. Redis server is running: `redis-cli ping` (should return PONG)
2. Redis URL is correct in environment variables
3. Firewall allows connection to Redis port (default: 6379)
4. For Upstash, check API token is valid

### Cache Not Working

If caching doesn't seem to work:

1. Check `REDIS_URL` environment variable is set
2. Verify Redis client logs in console
3. Check if cache keys are being generated correctly
4. Ensure TTL values are appropriate

### High Memory Usage

If Redis uses too much memory:

1. Review TTL values and reduce them if needed
2. Implement cache eviction policy (see `redis.conf`)
3. Monitor and clean up stale keys
4. Consider using shorter TTLs for large objects

## Configuration

Redis configuration file (`redis.conf`) includes:

- Memory limit: 256MB (configurable)
- Eviction policy: allkeys-lru
- Persistence: AOF enabled
- Security: Password required (production)

See `redis.conf` for full configuration options.

## Future Enhancements

- [ ] Implement cache warming on application startup
- [ ] Add cache hit/miss metrics
- [ ] Implement distributed caching with Redis Cluster
- [ ] Add cache compression for large objects
- [ ] Implement cache versioning for easier updates
