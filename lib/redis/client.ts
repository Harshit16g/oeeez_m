/**
 * Redis Client Configuration
 * Provides caching layer for session & query optimization
 */

import Redis from 'ioredis'

let redis: Redis | null = null

/**
 * Get or create Redis client instance
 * Supports both local development and production environments
 */
export function getRedisClient(): Redis | null {
  // Return null if Redis URL is not configured (graceful degradation)
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured. Caching will be disabled.')
    return null
  }

  // Return existing client if already initialized
  if (redis) {
    return redis
  }

  try {
    // Initialize Redis client
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true
        }
        return false
      },
    })

    redis.on('error', (err) => {
      console.error('Redis client error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis client connected')
    })

    return redis
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    return null
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

/**
 * Cache key generators for consistent naming
 * Aligned with database schema relationships: user → service → booking → review
 * Format: oeeez:{entity_type}:{entity_id} (matches get_cache_key function in database)
 */
export const CacheKeys = {
  // User caches
  userProfile: (userId: string) => `oeeez:user:profile:${userId}`,
  userSession: (sessionId: string) => `oeeez:session:${sessionId}`,
  userBookings: (userId: string) => `oeeez:user:bookings:${userId}`,
  userNotifications: (userId: string) => `oeeez:user:notifications:${userId}`,
  userReviews: (userId: string) => `oeeez:user:reviews:${userId}`,
  userServices: (userId: string) => `oeeez:user:services:${userId}`,
  
  // Provider caches
  providerProfile: (providerId: string) => `oeeez:provider:profile:${providerId}`,
  
  // Service caches
  serviceDetail: (serviceId: string) => `oeeez:service:detail:${serviceId}`,
  serviceReviews: (serviceId: string) => `oeeez:service:reviews:${serviceId}`,
  serviceBookings: (serviceId: string) => `oeeez:service:bookings:${serviceId}`,
  
  // Category caches
  categoryProviders: (categorySlug: string) => `oeeez:category:${categorySlug}:providers`,
  categoryServices: (categoryId: string) => `oeeez:category:services:${categoryId}`,
  
  // Booking caches
  bookingDetail: (bookingId: string) => `oeeez:booking:detail:${bookingId}`,
  
  // Review caches
  reviewDetail: (reviewId: string) => `oeeez:review:detail:${reviewId}`,
  
  // Aggregated data caches
  serviceRatings: (serviceId: string) => `oeeez:service:ratings:${serviceId}`,
  providerRatings: (providerId: string) => `oeeez:provider:ratings:${providerId}`,
  dashboardStats: (userId: string) => `oeeez:dashboard:stats:${userId}`,
  
  // Marketplace caches (legacy compatibility)
  popularArtists: () => 'oeeez:artists:popular',
}

/**
 * Default cache TTLs (Time To Live) in seconds
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for semi-static data
  LONG: 3600, // 1 hour - for static data
  DAY: 86400, // 24 hours - for rarely changing data
}

/**
 * Redis SCAN batch size - configurable via environment variable
 * Default: 100 keys per iteration
 * Validates and clamps to reasonable range (1-10000)
 */
const REDIS_SCAN_BATCH_SIZE = (() => {
  const envValue = process.env.REDIS_SCAN_BATCH_SIZE
  const defaultValue = 100
  const maxValue = 10000
  
  if (!envValue) {
    return defaultValue
  }
  
  const parsed = parseInt(envValue, 10)
  
  // Validate: must be finite positive integer >= 1
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.warn(
      `Invalid REDIS_SCAN_BATCH_SIZE: "${envValue}". Must be a positive integer >= 1. Falling back to default: ${defaultValue}`
    )
    return defaultValue
  }
  
  // Clamp to max value to prevent excessive memory usage
  if (parsed > maxValue) {
    console.warn(
      `REDIS_SCAN_BATCH_SIZE: ${parsed} exceeds maximum ${maxValue}. Clamping to ${maxValue}`
    )
    return maxValue
  }
  
  return parsed
})()

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client) return null

    try {
      const data = await client.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: unknown, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false

    try {
      const serialized = JSON.stringify(value)
      await client.setex(key, ttl, serialized)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string | string[]): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false

    try {
      const keys = Array.isArray(key) ? key : [key]
      await client.del(...keys)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },

  /**
   * Invalidate cache by pattern using cursor-based SCAN
   * Replaces blocking keys() with efficient SCAN loop
   */
  async invalidatePattern(pattern: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false

    try {
      const keysToDelete: string[] = []
      let cursor = '0'
      
      // Use SCAN to iterate through keys matching the pattern
      // This is non-blocking and memory-efficient compared to keys()
      do {
        const result = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          REDIS_SCAN_BATCH_SIZE
        )
        cursor = result[0]
        const matchedKeys = result[1]
        
        if (matchedKeys.length > 0) {
          keysToDelete.push(...matchedKeys)
        }
      } while (cursor !== '0')
      
      // Delete keys in batches using pipeline for efficiency
      if (keysToDelete.length > 0) {
        const pipeline = client.pipeline()
        keysToDelete.forEach(key => pipeline.unlink(key)) // unlink is async delete
        await pipeline.exec()
      }
      
      return true
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
      return false
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false

    try {
      const exists = await client.exists(key)
      return exists === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // If not in cache, fetch data
    const data = await fetcher()

    // Store in cache for next time
    await this.set(key, data, ttl)

    return data
  },
}
