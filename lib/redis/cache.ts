import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  prefix?: string
}

export class CacheManager {
  private static instance: CacheManager
  private enabled: boolean

  private constructor() {
    this.enabled = process.env.ENABLE_REDIS_CACHE === "true"
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  private getKey(key: string, prefix?: string): string {
    const cachePrefix = prefix || REDIS_CONFIG.cache.prefix
    return `${cachePrefix}${key}`
  }

  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return null
    }

    try {
      const cacheKey = this.getKey(key, options.prefix)
      return await redisClient.get<T>(cacheKey)
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error)
      return null
    }
  }

  public async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const cacheKey = this.getKey(key, options.prefix)
      const ttl = options.ttl || REDIS_CONFIG.cache.defaultTTL

      await redisClient.set(cacheKey, value, ttl)

      // Handle cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTags(cacheKey, options.tags)
      }
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error)
    }
  }

  public async del(key: string | string[], options: CacheOptions = {}): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      if (Array.isArray(key)) {
        const cacheKeys = key.map((k) => this.getKey(k, options.prefix))
        await redisClient.del(cacheKeys)
      } else {
        const cacheKey = this.getKey(key, options.prefix)
        await redisClient.del(cacheKey)
      }
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error)
    }
  }

  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return false
    }

    try {
      const cacheKey = this.getKey(key, options.prefix)
      return await redisClient.exists(cacheKey)
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error)
      return false
    }
  }

  public async invalidateByTag(tag: string): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const tagKey = `${REDIS_CONFIG.tags.prefix}${tag}`
      const keys = await redisClient.get<string[]>(tagKey)

      if (keys && keys.length > 0) {
        await redisClient.del(keys)
        await redisClient.del(tagKey)
      }
    } catch (error) {
      console.error(`Cache invalidateByTag error for tag ${tag}:`, error)
    }
  }

  public async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    for (const tag of tags) {
      await this.invalidateByTag(tag)
    }
  }

  private async addTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `${REDIS_CONFIG.tags.prefix}${tag}`
        const existingKeys = (await redisClient.get<string[]>(tagKey)) || []

        if (!existingKeys.includes(cacheKey)) {
          existingKeys.push(cacheKey)
          await redisClient.set(tagKey, existingKeys, REDIS_CONFIG.cache.longTTL)
        }
      }
    } catch (error) {
      console.error(`Cache addTags error:`, error)
    }
  }

  public async flush(): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const pattern = `${REDIS_CONFIG.cache.prefix}*`
      const keys = await redisClient.keys(pattern)

      if (keys.length > 0) {
        await redisClient.del(keys)
      }
    } catch (error) {
      console.error(`Cache flush error:`, error)
    }
  }

  public async getStats(): Promise<{
    enabled: boolean
    connected: boolean
    totalKeys: number
    cacheKeys: number
    sessionKeys: number
    tagKeys: number
  }> {
    const stats = {
      enabled: this.enabled,
      connected: redisClient.isConnected(),
      totalKeys: 0,
      cacheKeys: 0,
      sessionKeys: 0,
      tagKeys: 0,
    }

    if (!this.enabled || !redisClient.isConnected()) {
      return stats
    }

    try {
      const [cacheKeys, sessionKeys, tagKeys] = await Promise.all([
        redisClient.keys(`${REDIS_CONFIG.cache.prefix}*`),
        redisClient.keys(`${REDIS_CONFIG.session.prefix}*`),
        redisClient.keys(`${REDIS_CONFIG.tags.prefix}*`),
      ])

      stats.cacheKeys = cacheKeys.length
      stats.sessionKeys = sessionKeys.length
      stats.tagKeys = tagKeys.length
      stats.totalKeys = stats.cacheKeys + stats.sessionKeys + stats.tagKeys
    } catch (error) {
      console.error("Cache getStats error:", error)
    }

    return stats
  }
}

export const cacheManager = CacheManager.getInstance()

// Convenience functions
export const cache = {
  get: <T = any>(key: string, options?: CacheOptions) => cacheManager.get<T>(key, options),
  set: <T = any>(key: string, value: T, options?: CacheOptions) => cacheManager.set(key, value, options),
  del: (key: string | string[], options?: CacheOptions) => cacheManager.del(key, options),
  exists: (key: string, options?: CacheOptions) => cacheManager.exists(key, options),
  invalidateByTag: (tag: string) => cacheManager.invalidateByTag(tag),
  invalidateByTags: (tags: string[]) => cacheManager.invalidateByTags(tags),
  flush: () => cacheManager.flush(),
  getStats: () => cacheManager.getStats(),
}

export default cache
