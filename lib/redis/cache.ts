import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"

export interface CacheOptions {
  ttl?: keyof typeof REDIS_CONFIG.ttl | number
  tags?: string[]
  compress?: boolean
}

class CacheManager {
  private getKey(key: string): string {
    return `${REDIS_CONFIG.keyPrefixes.cache}${key}`
  }

  private getTagKey(tag: string): string {
    return `${REDIS_CONFIG.keyPrefixes.tag}${tag}`
  }

  private getTTL(ttl?: keyof typeof REDIS_CONFIG.ttl | number): number {
    if (typeof ttl === "number") {
      return ttl
    }
    if (typeof ttl === "string" && ttl in REDIS_CONFIG.ttl) {
      return REDIS_CONFIG.ttl[ttl]
    }
    return REDIS_CONFIG.ttl.mediumCache
  }

  public async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    if (!REDIS_CONFIG.features.enableCache) {
      return
    }

    try {
      const cacheKey = this.getKey(key)
      const ttl = this.getTTL(options.ttl)

      await redisClient.set(cacheKey, value, ttl)

      // Handle tags
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = this.getTagKey(tag)
          await redisClient.getClient()?.sadd(tagKey, cacheKey)
          await redisClient.expire(tagKey, ttl + 3600) // Tag expires 1 hour after cache
        }
      }

      console.log(`📦 Cached: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error)
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (!REDIS_CONFIG.features.enableCache) {
      return null
    }

    try {
      const cacheKey = this.getKey(key)
      const value = await redisClient.get<T>(cacheKey)

      if (value) {
        console.log(`🎯 Cache hit: ${key}`)
      } else {
        console.log(`❌ Cache miss: ${key}`)
      }

      return value
    } catch (error) {
      console.error(`Failed to get cached ${key}:`, error)
      return null
    }
  }

  public async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key.map((k) => this.getKey(k)) : [this.getKey(key)]
      await redisClient.del(keys)

      console.log(`🗑️ Cache deleted: ${Array.isArray(key) ? key.join(", ") : key}`)
    } catch (error) {
      console.error(`Failed to delete cached ${key}:`, error)
    }
  }

  public async delByTag(tag: string): Promise<void> {
    try {
      const tagKey = this.getTagKey(tag)
      const keys = (await redisClient.getClient()?.smembers(tagKey)) || []

      if (keys.length > 0) {
        await redisClient.del(keys)
        await redisClient.del(tagKey)
        console.log(`🏷️ Cache deleted by tag '${tag}': ${keys.length} items`)
      }
    } catch (error) {
      console.error(`Failed to delete cache by tag ${tag}:`, error)
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key)
      return await redisClient.exists(cacheKey)
    } catch (error) {
      console.error(`Failed to check cache existence for ${key}:`, error)
      return false
    }
  }

  public async clear(): Promise<void> {
    try {
      const pattern = `${REDIS_CONFIG.keyPrefixes.cache}*`
      const keys = await redisClient.keys(pattern)

      if (keys.length > 0) {
        await redisClient.del(keys)
        console.log(`🧹 Cache cleared: ${keys.length} items`)
      }
    } catch (error) {
      console.error("Failed to clear cache:", error)
    }
  }

  public async getOrSet<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // If not in cache, fetch and cache
      const value = await fetchFn()
      await this.set(key, value, options)
      return value
    } catch (error) {
      console.error(`Failed to get or set cache for ${key}:`, error)
      // If cache fails, still try to fetch
      return await fetchFn()
    }
  }

  // User-specific cache methods
  public async cacheUserProfile(userId: string, profile: any): Promise<void> {
    await this.set(`user:profile:${userId}`, profile, {
      ttl: "userProfile",
      tags: ["user", `user:${userId}`],
    })
  }

  public async getCachedUserProfile(userId: string): Promise<any> {
    return await this.get(`user:profile:${userId}`)
  }

  public async invalidateUser(userId: string): Promise<void> {
    await this.delByTag(`user:${userId}`)
  }

  // Artist-specific cache methods
  public async cacheArtist(artistId: string, artist: any): Promise<void> {
    await this.set(`artist:${artistId}`, artist, {
      ttl: "artistData",
      tags: ["artist", `artist:${artistId}`],
    })
  }

  public async getCachedArtist(artistId: string): Promise<any> {
    return await this.get(`artist:${artistId}`)
  }

  public async invalidateArtist(artistId: string): Promise<void> {
    await this.delByTag(`artist:${artistId}`)
  }

  // Search cache methods
  public async cacheSearch(query: string, results: any, ttl = "shortCache"): Promise<void> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`
    await this.set(searchKey, results, {
      ttl,
      tags: ["search"],
    })
  }

  public async getCachedSearch(query: string): Promise<any> {
    const searchKey = `search:${Buffer.from(query).toString("base64")}`
    return await this.get(searchKey)
  }

  public async invalidateSearch(): Promise<void> {
    await this.delByTag("search")
  }

  // Statistics and monitoring
  public async getStats(): Promise<{
    totalKeys: number
    cacheHits: number
    cacheMisses: number
    memoryUsage?: string
  }> {
    try {
      const cacheKeys = await redisClient.keys(`${REDIS_CONFIG.keyPrefixes.cache}*`)

      return {
        totalKeys: cacheKeys.length,
        cacheHits: 0, // Would need Redis INFO command for actual stats
        cacheMisses: 0,
        memoryUsage: "N/A",
      }
    } catch (error) {
      console.error("Failed to get cache stats:", error)
      return {
        totalKeys: 0,
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsage: "Error",
      }
    }
  }
}

export const cacheManager = new CacheManager()
export default cacheManager
