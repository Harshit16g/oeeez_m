import { getRedis, isRedisEnabled } from "./client"
import { REDIS_CONFIG, CACHE_KEYS } from "./config"

export const runtime = "nodejs"

export interface CacheOptions {
  ttl?: number
  compress?: boolean
}

export async function setCache(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
  if (!isRedisEnabled) {
    return false
  }

  try {
    const redis = await getRedis()
    if (!redis) return false

    const ttl = options.ttl || REDIS_CONFIG.DEFAULT_TTL
    let serializedValue = JSON.stringify(value)

    // Compress large values
    if (options.compress && serializedValue.length > REDIS_CONFIG.COMPRESSION_THRESHOLD) {
      const zlib = await import("zlib")
      serializedValue = zlib.gzipSync(serializedValue).toString("base64")
      key = `compressed:${key}`
    }

    await redis.setex(key, ttl, serializedValue)

    // Update cache stats
    if (REDIS_CONFIG.METRICS) {
      await redis.hincrby(CACHE_KEYS.CACHE_STATS, "sets", 1)
    }

    return true
  } catch (error) {
    console.error("Failed to set cache:", error)
    return false
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  if (!isRedisEnabled) {
    return null
  }

  try {
    const redis = await getRedis()
    if (!redis) return null

    // Check for compressed version first
    let value = await redis.get(`compressed:${key}`)
    let isCompressed = true

    if (!value) {
      value = await redis.get(key)
      isCompressed = false
    }

    if (!value) {
      if (REDIS_CONFIG.METRICS) {
        await redis.hincrby(CACHE_KEYS.CACHE_STATS, "misses", 1)
      }
      return null
    }

    // Decompress if needed
    if (isCompressed) {
      const zlib = await import("zlib")
      value = zlib.gunzipSync(Buffer.from(value, "base64")).toString()
    }

    if (REDIS_CONFIG.METRICS) {
      await redis.hincrby(CACHE_KEYS.CACHE_STATS, "hits", 1)
    }

    return JSON.parse(value)
  } catch (error) {
    console.error("Failed to get cache:", error)
    return null
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  if (!isRedisEnabled) {
    return true
  }

  try {
    const redis = await getRedis()
    if (!redis) return true

    await redis.del(key)
    await redis.del(`compressed:${key}`)

    if (REDIS_CONFIG.METRICS) {
      await redis.hincrby(CACHE_KEYS.CACHE_STATS, "deletes", 1)
    }

    return true
  } catch (error) {
    console.error("Failed to delete cache:", error)
    return true
  }
}

export async function clearCache(pattern?: string): Promise<number> {
  if (!isRedisEnabled) {
    return 0
  }

  try {
    const redis = await getRedis()
    if (!redis) return 0

    const searchPattern = pattern || "*"
    const keys = await redis.keys(searchPattern)

    if (keys.length === 0) return 0

    await redis.del(...keys)

    if (REDIS_CONFIG.METRICS) {
      await redis.hincrby(CACHE_KEYS.CACHE_STATS, "clears", 1)
    }

    return keys.length
  } catch (error) {
    console.error("Failed to clear cache:", error)
    return 0
  }
}

export async function getCacheStats(): Promise<Record<string, string> | null> {
  if (!isRedisEnabled || !REDIS_CONFIG.METRICS) {
    return null
  }

  try {
    const redis = await getRedis()
    if (!redis) return null

    return await redis.hgetall(CACHE_KEYS.CACHE_STATS)
  } catch (error) {
    console.error("Failed to get cache stats:", error)
    return null
  }
}
