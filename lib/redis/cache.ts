export const runtime = "nodejs"

import { getRedis, isRedisEnabled } from "./client"

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  shortCache: Number(process.env.CACHE_TTL_SHORT ?? 300), // 5 minutes
  mediumCache: Number(process.env.CACHE_TTL_MEDIUM ?? 1800), // 30 minutes
  longCache: Number(process.env.CACHE_TTL_LONG ?? 7200), // 2 hours
  userProfile: Number(process.env.CACHE_TTL_USER_PROFILE ?? 3600), // 1 hour
  artistData: Number(process.env.CACHE_TTL_ARTIST_DATA ?? 1800), // 30 minutes
  notifications: Number(process.env.CACHE_TTL_NOTIFICATIONS ?? 300), // 5 minutes
}

// Cache key prefixes
const CACHE_PREFIX = process.env.REDIS_CACHE_PREFIX || "cache:"
const TAG_PREFIX = process.env.REDIS_TAG_PREFIX || "tag:"

export interface CacheOptions {
  ttl?: keyof typeof CACHE_TTL | number
  tags?: string[]
}

export const cacheManager = {
  // Basic cache operations
  async get(key: string): Promise<any> {
    if (!isRedisEnabled()) return null

    try {
      const redis = getRedis()
      if (!redis) return null

      const data = await redis.get(`${CACHE_PREFIX}${key}`)
      return data ? JSON.parse(data) : null
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

      const cacheKey = `${CACHE_PREFIX}${key}`
      const serializedValue = JSON.stringify(value)

      // Determine TTL
      let ttl: number
      if (typeof options.ttl === "number") {
        ttl = options.ttl
      } else if (options.ttl && typeof options.ttl === "string") {
        ttl = CACHE_TTL[options.ttl] || CACHE_TTL.mediumCache
      } else {
        ttl = CACHE_TTL.mediumCache
      }

      // Set the cache entry
      await redis.setex(cacheKey, ttl, serializedValue)

      // Handle tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `${TAG_PREFIX}${tag}`
          await redis.sadd(tagKey, cacheKey)
          await redis.expire(tagKey, ttl + 300) // Tag expires 5 minutes after cache
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

      await redis.del(`${CACHE_PREFIX}${key}`)
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

      const result = await redis.exists(`${CACHE_PREFIX}${key}`)
      return result === 1
    } catch (err) {
      console.error("Cache EXISTS error:", err)
      return false
    }
  },

  // Tag-based cache invalidation
  async invalidateByTag(tag: string): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      const tagKey = `${TAG_PREFIX}${tag}`
      const cacheKeys = await redis.smembers(tagKey)

      if (cacheKeys.length === 0) return 0

      // Delete all cache entries with this tag
      await redis.del(...cacheKeys)
      // Delete the tag set
      await redis.del(tagKey)

      return cacheKeys.length
    } catch (err) {
      console.error("Cache invalidateByTag error:", err)
      return 0
    }
  },

  // User-specific cache operations
  async getCachedUserProfile(userId: string): Promise<any> {
    return await this.get(`user:profile:${userId}`)
  },

  async cacheUserProfile(userId: string, profile: any): Promise<boolean> {
    return await this.set(`user:profile:${userId}`, profile, {
      ttl: "userProfile",
      tags: ["user", `user:${userId}`],
    })
  },

  async invalidateUser(userId: string): Promise<void> {
    await this.invalidateByTag(`user:${userId}`)
  },

  // Artist-specific cache operations
  async getCachedArtist(artistId: string): Promise<any> {
    return await this.get(`artist:${artistId}`)
  },

  async cacheArtist(artistId: string, artist: any): Promise<boolean> {
    return await this.set(`artist:${artistId}`, artist, {
      ttl: "artistData",
      tags: ["artist", `artist:${artistId}`],
    })
  },

  async invalidateArtist(artistId: string): Promise<void> {
    await this.invalidateByTag(`artist:${artistId}`)
  },

  // Search cache operations
  async getCachedSearch(query: string): Promise<any> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`
    return await this.get(searchKey)
  },

  async cacheSearch(query: string, results: any): Promise<boolean> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`
    return await this.set(searchKey, results, {
      ttl: "shortCache",
      tags: ["search"],
    })
  },

  // Notification cache operations
  async getCachedNotifications(userId: string): Promise<any> {
    return await this.get(`notifications:${userId}`)
  },

  async cacheNotifications(userId: string, notifications: any): Promise<boolean> {
    return await this.set(`notifications:${userId}`, notifications, {
      ttl: "notifications",
      tags: ["notifications", `user:${userId}`],
    })
  },

  // Cache statistics and management
  async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
  }> {
    if (!isRedisEnabled()) {
      return { totalKeys: 0, memoryUsage: "0B", hitRate: 0 }
    }

    try {
      const redis = getRedis()
      if (!redis) return { totalKeys: 0, memoryUsage: "0B", hitRate: 0 }

      const info = await redis.info("memory")
      const keyspace = await redis.info("keyspace")

      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : "0B"

      // Parse total keys
      const keysMatch = keyspace.match(/keys=(\d+)/)
      const totalKeys = keysMatch ? Number.parseInt(keysMatch[1]) : 0

      // Calculate hit rate (simplified)
      const stats = await redis.info("stats")
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/)
      const missesMatch = stats.match(/keyspace_misses:(\d+)/)

      const hits = hitsMatch ? Number.parseInt(hitsMatch[1]) : 0
      const misses = missesMatch ? Number.parseInt(missesMatch[1]) : 0
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0

      return { totalKeys, memoryUsage, hitRate }
    } catch (err) {
      console.error("Cache getCacheStats error:", err)
      return { totalKeys: 0, memoryUsage: "0B", hitRate: 0 }
    }
  },

  async clearAllCache(): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const pattern = `${CACHE_PREFIX}*`
      const keys = await redis.keys(pattern)

      if (keys.length > 0) {
        await redis.del(...keys)
      }

      // Also clear tag keys
      const tagPattern = `${TAG_PREFIX}*`
      const tagKeys = await redis.keys(tagPattern)

      if (tagKeys.length > 0) {
        await redis.del(...tagKeys)
      }

      return true
    } catch (err) {
      console.error("Cache clearAllCache error:", err)
      return false
    }
  },

  // Batch operations
  async mget(keys: string[]): Promise<(any | null)[]> {
    if (!isRedisEnabled()) return keys.map(() => null)

    try {
      const redis = getRedis()
      if (!redis) return keys.map(() => null)

      const cacheKeys = keys.map((key) => `${CACHE_PREFIX}${key}`)
      const values = await redis.mget(...cacheKeys)

      return values.map((value) => (value ? JSON.parse(value) : null))
    } catch (err) {
      console.error("Cache MGET error:", err)
      return keys.map(() => null)
    }
  },

  async mset(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const pipeline = redis.pipeline()

      for (const entry of entries) {
        const cacheKey = `${CACHE_PREFIX}${entry.key}`
        const serializedValue = JSON.stringify(entry.value)

        // Determine TTL
        let ttl: number
        if (typeof entry.options?.ttl === "number") {
          ttl = entry.options.ttl
        } else if (entry.options?.ttl && typeof entry.options.ttl === "string") {
          ttl = CACHE_TTL[entry.options.ttl] || CACHE_TTL.mediumCache
        } else {
          ttl = CACHE_TTL.mediumCache
        }

        pipeline.setex(cacheKey, ttl, serializedValue)

        // Handle tags
        if (entry.options?.tags && entry.options.tags.length > 0) {
          for (const tag of entry.options.tags) {
            const tagKey = `${TAG_PREFIX}${tag}`
            pipeline.sadd(tagKey, cacheKey)
            pipeline.expire(tagKey, ttl + 300)
          }
        }
      }

      await pipeline.exec()
      return true
    } catch (err) {
      console.error("Cache MSET error:", err)
      return false
    }
  },
}

export default cacheManager
