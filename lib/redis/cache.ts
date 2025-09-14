export const runtime = "nodejs"

import { getRedis, isRedisEnabled } from "./client"
import { REDIS_CONFIG } from "./config"

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  compress?: boolean
}

export interface CacheStats {
  totalKeys: number
  cacheKeys: number
  sessionKeys: number
  rateLimitKeys: number
  memoryUsage?: string
  hitRate?: number
}

export const cacheManager = {
  // Basic cache operations
  async get<T = any>(key: string): Promise<T | null> {
    if (!isRedisEnabled()) return null

    try {
      const redis = getRedis()
      if (!redis) return null

      const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
      const value = await redis.get(fullKey)

      if (!value) return null

      return JSON.parse(value) as T
    } catch (err) {
      console.error("Cache GET error:", err)
      return null
    }
  },

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
      const serializedValue = JSON.stringify(value)
      const ttl = options.ttl || REDIS_CONFIG.ttl.medium

      // Set the main cache entry
      await redis.setex(fullKey, ttl, serializedValue)

      // Handle tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `${REDIS_CONFIG.keyPrefixes.tag}${tag}`
          await redis.sadd(tagKey, fullKey)
          await redis.expire(tagKey, ttl)
        }
      }

      return true
    } catch (err) {
      console.error("Cache SET error:", err)
      return false
    }
  },

  async del(key: string): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
      await redis.del(fullKey)
      return true
    } catch (err) {
      console.error("Cache DEL error:", err)
      return false
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
      const result = await redis.exists(fullKey)
      return result === 1
    } catch (err) {
      console.error("Cache EXISTS error:", err)
      return false
    }
  },

  // Cache invalidation by tags
  async invalidateByTag(tag: string): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      const tagKey = `${REDIS_CONFIG.keyPrefixes.tag}${tag}`
      const keys = await redis.smembers(tagKey)

      if (keys.length === 0) return 0

      // Delete all keys associated with this tag
      await redis.del(...keys)
      // Delete the tag set itself
      await redis.del(tagKey)

      return keys.length
    } catch (err) {
      console.error("Cache invalidateByTag error:", err)
      return 0
    }
  },

  // Cache invalidation by pattern
  async invalidateByPattern(pattern: string): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      const fullPattern = `${REDIS_CONFIG.keyPrefixes.cache}${pattern}`
      const keys = await redis.keys(fullPattern)

      if (keys.length === 0) return 0

      await redis.del(...keys)
      return keys.length
    } catch (err) {
      console.error("Cache invalidateByPattern error:", err)
      return 0
    }
  },

  // User-specific cache operations
  async cacheUserProfile(userId: string, profile: any): Promise<boolean> {
    return await this.set(`user:${userId}:profile`, profile, {
      ttl: REDIS_CONFIG.ttl.userProfile,
      tags: [`user:${userId}`, "profiles"],
    })
  },

  async getUserProfile(userId: string): Promise<any> {
    return await this.get(`user:${userId}:profile`)
  },

  async invalidateUser(userId: string): Promise<number> {
    return await this.invalidateByTag(`user:${userId}`)
  },

  // Artist-specific cache operations
  async cacheArtistData(artistId: string, data: any): Promise<boolean> {
    return await this.set(`artist:${artistId}:data`, data, {
      ttl: REDIS_CONFIG.ttl.artistData,
      tags: [`artist:${artistId}`, "artists"],
    })
  },

  async getArtistData(artistId: string): Promise<any> {
    return await this.get(`artist:${artistId}:data`)
  },

  async invalidateArtist(artistId: string): Promise<number> {
    return await this.invalidateByTag(`artist:${artistId}`)
  },

  // Notification cache operations
  async cacheUserNotifications(userId: string, notifications: any[]): Promise<boolean> {
    return await this.set(`user:${userId}:notifications`, notifications, {
      ttl: REDIS_CONFIG.ttl.notifications,
      tags: [`user:${userId}`, "notifications"],
    })
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    return (await this.get(`user:${userId}:notifications`)) || []
  },

  // Analytics cache operations
  async cacheAnalytics(key: string, data: any): Promise<boolean> {
    return await this.set(`analytics:${key}`, data, {
      ttl: REDIS_CONFIG.ttl.analytics,
      tags: ["analytics"],
    })
  },

  async getAnalytics(key: string): Promise<any> {
    return await this.get(`analytics:${key}`)
  },

  // Cache statistics
  async getCacheStats(): Promise<CacheStats> {
    if (!isRedisEnabled()) {
      return {
        totalKeys: 0,
        cacheKeys: 0,
        sessionKeys: 0,
        rateLimitKeys: 0,
      }
    }

    try {
      const redis = getRedis()
      if (!redis) {
        return {
          totalKeys: 0,
          cacheKeys: 0,
          sessionKeys: 0,
          rateLimitKeys: 0,
        }
      }

      const [cacheKeys, sessionKeys, rateLimitKeys] = await Promise.all([
        redis.keys(`${REDIS_CONFIG.keyPrefixes.cache}*`),
        redis.keys(`${REDIS_CONFIG.keyPrefixes.session}*`),
        redis.keys(`${REDIS_CONFIG.keyPrefixes.rateLimit}*`),
      ])

      return {
        totalKeys: cacheKeys.length + sessionKeys.length + rateLimitKeys.length,
        cacheKeys: cacheKeys.length,
        sessionKeys: sessionKeys.length,
        rateLimitKeys: rateLimitKeys.length,
      }
    } catch (err) {
      console.error("Cache stats error:", err)
      return {
        totalKeys: 0,
        cacheKeys: 0,
        sessionKeys: 0,
        rateLimitKeys: 0,
      }
    }
  },

  // Clear all cache (dangerous operation)
  async clearAllCache(): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const pattern = `${REDIS_CONFIG.keyPrefixes.cache}*`
      const keys = await redis.keys(pattern)

      if (keys.length > 0) {
        await redis.del(...keys)
      }

      return true
    } catch (err) {
      console.error("Cache clear error:", err)
      return false
    }
  },

  // Cleanup expired cache entries
  async cleanupExpiredCache(): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      let cleaned = 0
      const pattern = `${REDIS_CONFIG.keyPrefixes.cache}*`
      const keys = await redis.keys(pattern)

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl === -1) {
          // Key exists but has no expiration, delete it
          await redis.del(key)
          cleaned++
        }
      }

      return cleaned
    } catch (err) {
      console.error("Cache cleanup error:", err)
      return 0
    }
  },
}

export default cacheManager
