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
 */
export const CacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userSession: (sessionId: string) => `session:${sessionId}`,
  userBookings: (userId: string) => `user:bookings:${userId}`,
  userNotifications: (userId: string) => `user:notifications:${userId}`,
  popularArtists: () => 'artists:popular',
  categoryProviders: (categorySlug: string) => `category:${categorySlug}:providers`,
  dashboardStats: (userId: string) => `dashboard:stats:${userId}`,
  userReviews: (userId: string) => `user:reviews:${userId}`,
  serviceDetail: (serviceId: string) => `service:${serviceId}`,
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
 */
const REDIS_SCAN_BATCH_SIZE = Number(process.env.REDIS_SCAN_BATCH_SIZE) || 100

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
