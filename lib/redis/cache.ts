import { getRedisClient } from "./client"
import { redisConfig } from "./config"

interface CacheOptions {
  ttl?: number
  compress?: boolean
}

class CacheManager {
  private getCacheKey(key: string): string {
    return `cache:${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redisConfig.enabled) {
      return null
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return null

      const cacheKey = this.getCacheKey(key)
      const value = await redis.get(cacheKey)

      if (!value) return null

      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!redisConfig.enabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const cacheKey = this.getCacheKey(key)
      const ttl = options.ttl || redisConfig.defaultTTL

      let serializedValue: string
      if (typeof value === "string") {
        serializedValue = value
      } else {
        serializedValue = JSON.stringify(value)
      }

      await redis.setex(cacheKey, ttl, serializedValue)
      return true
    } catch (error) {
      console.error("Cache set error:", error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!redisConfig.enabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const cacheKey = this.getCacheKey(key)
      const result = await redis.del(cacheKey)
      return result > 0
    } catch (error) {
      console.error("Cache delete error:", error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!redisConfig.enabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const cacheKey = this.getCacheKey(key)
      const result = await redis.exists(cacheKey)
      return result > 0
    } catch (error) {
      console.error("Cache exists error:", error)
      return false
    }
  }

  async flush(): Promise<boolean> {
    if (!redisConfig.enabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      await redis.flushdb()
      return true
    } catch (error) {
      console.error("Cache flush error:", error)
      return false
    }
  }

  // User profile specific methods
  async getCachedUserProfile(userId: string): Promise<any | null> {
    return this.get(`user_profile:${userId}`)
  }

  async cacheUserProfile(userId: string, profile: any): Promise<boolean> {
    return this.set(`user_profile:${userId}`, profile, { ttl: redisConfig.userProfileTTL })
  }

  async invalidateUser(userId: string): Promise<boolean> {
    const keys = [`user_profile:${userId}`, `user_sessions:${userId}`, `user_analytics:${userId}`]

    let success = true
    for (const key of keys) {
      const result = await this.del(key)
      if (!result) success = false
    }

    return success
  }

  // Analytics caching
  async getCachedAnalytics(key: string): Promise<any | null> {
    return this.get(`analytics:${key}`)
  }

  async cacheAnalytics(key: string, data: any): Promise<boolean> {
    return this.set(`analytics:${key}`, data, { ttl: redisConfig.analyticsTTL })
  }
}

export const cacheManager = new CacheManager()
