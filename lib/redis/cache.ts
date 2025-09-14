export const runtime = "nodejs"

import { safeGet, safeSet, safeDel, safeExists, safeExpire, safeKeys } from "./client"

const CACHE_PREFIX = process.env.REDIS_CACHE_PREFIX || "cache:"
const TAG_PREFIX = process.env.REDIS_TAG_PREFIX || "tag:"
const ANALYTICS_PREFIX = process.env.REDIS_ANALYTICS_PREFIX || "analytics:"

// TTL configurations
const TTL = {
  SHORT: Number(process.env.CACHE_TTL_SHORT ?? 300), // 5 minutes
  MEDIUM: Number(process.env.CACHE_TTL_MEDIUM ?? 1800), // 30 minutes
  LONG: Number(process.env.CACHE_TTL_LONG ?? 7200), // 2 hours
  USER_PROFILE: Number(process.env.CACHE_TTL_USER_PROFILE ?? 3600), // 1 hour
  ARTIST_DATA: Number(process.env.CACHE_TTL_ARTIST_DATA ?? 1800), // 30 minutes
  NOTIFICATIONS: Number(process.env.CACHE_TTL_NOTIFICATIONS ?? 300), // 5 minutes
}

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  prefix?: string
}

export class CacheManager {
  private static instance: CacheManager

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  private getKey(key: string, prefix: string = CACHE_PREFIX): string {
    return `${prefix}${key}`
  }

  private getTagKey(tag: string): string {
    return `${TAG_PREFIX}${tag}`
  }

  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.getKey(key, options.prefix)
    return await safeGet<T>(cacheKey)
  }

  public async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.prefix)
    const ttl = options.ttl || TTL.MEDIUM

    const success = await safeSet(cacheKey, value, ttl)

    if (success && options.tags) {
      // Associate cache key with tags for invalidation
      for (const tag of options.tags) {
        const tagKey = this.getTagKey(tag)
        const taggedKeys = (await safeGet<string[]>(tagKey)) || []
        if (!taggedKeys.includes(cacheKey)) {
          taggedKeys.push(cacheKey)
          await safeSet(tagKey, taggedKeys, ttl)
        }
      }
    }

    return success
  }

  public async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.prefix)
    return await safeDel(cacheKey)
  }

  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.prefix)
    return await safeExists(cacheKey)
  }

  public async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key, options.prefix)
    return await safeExpire(cacheKey, ttl)
  }

  public async invalidateByTag(tag: string): Promise<number> {
    const tagKey = this.getTagKey(tag)
    const taggedKeys = (await safeGet<string[]>(tagKey)) || []

    let invalidatedCount = 0
    for (const key of taggedKeys) {
      const success = await safeDel(key)
      if (success) invalidatedCount++
    }

    // Remove the tag key itself
    await safeDel(tagKey)

    console.log(`🧹 Invalidated ${invalidatedCount} cache entries for tag: ${tag}`)
    return invalidatedCount
  }

  public async invalidateByPattern(pattern: string): Promise<number> {
    const keys = await safeKeys(pattern)
    if (keys.length === 0) return 0

    const success = await safeDel(keys)
    const invalidatedCount = success ? keys.length : 0

    console.log(`🧹 Invalidated ${invalidatedCount} cache entries for pattern: ${pattern}`)
    return invalidatedCount
  }

  public async flush(): Promise<boolean> {
    const pattern = `${CACHE_PREFIX}*`
    const keys = await safeKeys(pattern)
    if (keys.length === 0) return true

    const success = await safeDel(keys)
    console.log(`🧹 Flushed ${keys.length} cache entries`)
    return success
  }

  // Specialized cache methods
  public async getUserProfile(userId: string): Promise<any> {
    return await this.get(`user_profile:${userId}`, { ttl: TTL.USER_PROFILE })
  }

  public async setUserProfile(userId: string, profile: any): Promise<boolean> {
    return await this.set(`user_profile:${userId}`, profile, {
      ttl: TTL.USER_PROFILE,
      tags: [`user:${userId}`, "profiles"],
    })
  }

  public async getArtistData(artistId: string): Promise<any> {
    return await this.get(`artist:${artistId}`, { ttl: TTL.ARTIST_DATA })
  }

  public async setArtistData(artistId: string, data: any): Promise<boolean> {
    return await this.set(`artist:${artistId}`, data, {
      ttl: TTL.ARTIST_DATA,
      tags: [`artist:${artistId}`, "artists"],
    })
  }

  public async getSearchResults(query: string, filters: any = {}): Promise<any> {
    const searchKey = `search:${query}:${JSON.stringify(filters)}`
    return await this.get(searchKey, { ttl: TTL.SHORT })
  }

  public async setSearchResults(query: string, filters: any = {}, results: any): Promise<boolean> {
    const searchKey = `search:${query}:${JSON.stringify(filters)}`
    return await this.set(searchKey, results, {
      ttl: TTL.SHORT,
      tags: ["search"],
    })
  }

  public async getNotifications(userId: string): Promise<any> {
    return await this.get(`notifications:${userId}`, { ttl: TTL.NOTIFICATIONS })
  }

  public async setNotifications(userId: string, notifications: any): Promise<boolean> {
    return await this.set(`notifications:${userId}`, notifications, {
      ttl: TTL.NOTIFICATIONS,
      tags: [`user:${userId}`, "notifications"],
    })
  }

  // Analytics caching
  public async getAnalytics(key: string): Promise<any> {
    return await this.get(key, { prefix: ANALYTICS_PREFIX, ttl: TTL.SHORT })
  }

  public async setAnalytics(key: string, data: any): Promise<boolean> {
    return await this.set(key, data, {
      prefix: ANALYTICS_PREFIX,
      ttl: TTL.SHORT,
      tags: ["analytics"],
    })
  }

  // Cache statistics
  public async getStats(): Promise<{
    totalKeys: number
    cacheKeys: number
    tagKeys: number
    analyticsKeys: number
  }> {
    const [cacheKeys, tagKeys, analyticsKeys] = await Promise.all([
      safeKeys(`${CACHE_PREFIX}*`),
      safeKeys(`${TAG_PREFIX}*`),
      safeKeys(`${ANALYTICS_PREFIX}*`),
    ])

    return {
      totalKeys: cacheKeys.length + tagKeys.length + analyticsKeys.length,
      cacheKeys: cacheKeys.length,
      tagKeys: tagKeys.length,
      analyticsKeys: analyticsKeys.length,
    }
  }
}

export const cacheManager = CacheManager.getInstance()

// Convenience functions
export async function getCached<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
  return await cacheManager.get<T>(key, options)
}

export async function setCached<T = any>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
  return await cacheManager.set(key, value, options)
}

export async function deleteCached(key: string, options?: CacheOptions): Promise<boolean> {
  return await cacheManager.del(key, options)
}

export async function invalidateTag(tag: string): Promise<number> {
  return await cacheManager.invalidateByTag(tag)
}

export async function invalidatePattern(pattern: string): Promise<number> {
  return await cacheManager.invalidateByPattern(pattern)
}
