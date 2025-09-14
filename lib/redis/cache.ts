import { safeGet, safeSet, safeDel, safeExists } from "./client"
import { REDIS_CONFIG } from "./config"

export interface CacheOptions {
  ttl?: number
  compress?: boolean
  tags?: string[]
}

export const cacheManager = {
  // User profile caching
  async getCachedUserProfile(userId: string): Promise<any> {
    if (!REDIS_CONFIG.features.enableCache) return null

    const key = `${REDIS_CONFIG.keyPrefixes.cache}user_profile:${userId}`
    return await safeGet(key)
  },

  async cacheUserProfile(userId: string, profile: any, ttl?: number): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const key = `${REDIS_CONFIG.keyPrefixes.cache}user_profile:${userId}`
    return await safeSet(key, profile, ttl || REDIS_CONFIG.ttl.userProfile)
  },

  async invalidateUserProfile(userId: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const key = `${REDIS_CONFIG.keyPrefixes.cache}user_profile:${userId}`
    return await safeDel(key)
  },

  // Artist listings caching
  async getCachedArtists(filters?: any): Promise<any> {
    if (!REDIS_CONFIG.features.enableCache) return null

    const filterKey = filters ? JSON.stringify(filters) : "all"
    const key = `${REDIS_CONFIG.keyPrefixes.cache}artists:${filterKey}`
    return await safeGet(key)
  },

  async cacheArtists(artists: any[], filters?: any, ttl?: number): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const filterKey = filters ? JSON.stringify(filters) : "all"
    const key = `${REDIS_CONFIG.keyPrefixes.cache}artists:${filterKey}`
    return await safeSet(key, artists, ttl || REDIS_CONFIG.ttl.cache)
  },

  async invalidateArtists(): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const pattern = `${REDIS_CONFIG.keyPrefixes.cache}artists:*`
    // Note: In production, you'd want to use SCAN instead of KEYS
    const keys = await safeGet(pattern) // This would need to be implemented with SCAN
    return keys ? await safeDel(keys) : false
  },

  // Generic caching methods
  async get(key: string): Promise<any> {
    if (!REDIS_CONFIG.features.enableCache) return null

    const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
    return await safeGet(fullKey)
  },

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
    const ttl = options.ttl || REDIS_CONFIG.ttl.cache
    return await safeSet(fullKey, value, ttl)
  },

  async del(key: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
    return await safeDel(fullKey)
  },

  async exists(key: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const fullKey = `${REDIS_CONFIG.keyPrefixes.cache}${key}`
    return await safeExists(fullKey)
  },

  // User-specific cache invalidation
  async invalidateUser(userId: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const keys = [
      `${REDIS_CONFIG.keyPrefixes.cache}user_profile:${userId}`,
      `${REDIS_CONFIG.keyPrefixes.cache}user_bookings:${userId}`,
      `${REDIS_CONFIG.keyPrefixes.cache}user_notifications:${userId}`,
    ]

    return await safeDel(keys)
  },

  // Analytics caching
  async getCachedAnalytics(key: string): Promise<any> {
    if (!REDIS_CONFIG.features.enableCache) return null

    const fullKey = `${REDIS_CONFIG.keyPrefixes.analytics}${key}`
    return await safeGet(fullKey)
  },

  async cacheAnalytics(key: string, data: any): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableCache) return false

    const fullKey = `${REDIS_CONFIG.keyPrefixes.analytics}${key}`
    return await safeSet(fullKey, data, REDIS_CONFIG.ttl.analytics)
  },

  // Cache warming
  async warmCache(): Promise<void> {
    if (!REDIS_CONFIG.features.enableCache) return

    console.log("🔥 Warming cache...")
    // Implement cache warming logic here
    // This could pre-load frequently accessed data
  },

  // Cache statistics
  async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
  }> {
    if (!REDIS_CONFIG.features.enableCache) {
      return { totalKeys: 0, memoryUsage: "0B", hitRate: 0 }
    }

    // This would need to be implemented with Redis INFO commands
    return { totalKeys: 0, memoryUsage: "0B", hitRate: 0 }
  },
}

export default cacheManager
