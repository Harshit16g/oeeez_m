export const runtime = "nodejs"

import { getRedis, isRedisEnabled } from "./client"

const RATE_LIMIT_PREFIX = process.env.REDIS_RATE_LIMIT_PREFIX || "rate:"
const DEFAULT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW ?? 3600) // 1 hour
const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 100) // 100 requests per hour

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  total: number
}

export interface RateLimitOptions {
  window?: number // Time window in seconds
  max?: number // Maximum requests in window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export const rateLimiter = {
  async checkRateLimit(identifier: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    const { window = DEFAULT_WINDOW, max = DEFAULT_MAX } = options

    // If rate limiting is disabled, allow all requests
    if (!isRedisEnabled() || process.env.ENABLE_RATE_LIMITING !== "true") {
      return {
        allowed: true,
        remaining: max,
        resetTime: Date.now() + window * 1000,
        total: max,
      }
    }

    try {
      const redis = getRedis()
      if (!redis) {
        return {
          allowed: true,
          remaining: max,
          resetTime: Date.now() + window * 1000,
          total: max,
        }
      }

      const now = Date.now()
      const windowStart = Math.floor(now / (window * 1000)) * (window * 1000)
      const key = `${RATE_LIMIT_PREFIX}${identifier}:${windowStart}`

      // Use pipeline for atomic operations
      const pipeline = redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, window)
      pipeline.ttl(key)

      const results = await pipeline.exec()
      if (!results) throw new Error("Pipeline execution failed")

      const count = results[0][1] as number
      const ttl = results[2][1] as number

      const resetTime = ttl > 0 ? now + ttl * 1000 : windowStart + window * 1000
      const remaining = Math.max(0, max - count)
      const allowed = count <= max

      return {
        allowed,
        remaining,
        resetTime,
        total: max,
      }
    } catch (err) {
      console.error("Rate limit check error:", err)
      // On error, allow the request
      return {
        allowed: true,
        remaining: max,
        resetTime: Date.now() + window * 1000,
        total: max,
      }
    }
  },

  // IP-based rate limiting
  async checkIPRateLimit(ip: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    return await this.checkRateLimit(`ip:${ip}`, options)
  },

  // User-based rate limiting
  async checkUserRateLimit(userId: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    return await this.checkRateLimit(`user:${userId}`, options)
  },

  // API endpoint rate limiting
  async checkEndpointRateLimit(
    endpoint: string,
    identifier: string,
    options: RateLimitOptions = {},
  ): Promise<RateLimitResult> {
    return await this.checkRateLimit(`endpoint:${endpoint}:${identifier}`, options)
  },

  // Global rate limiting
  async checkGlobalRateLimit(options: RateLimitOptions = {}): Promise<RateLimitResult> {
    return await this.checkRateLimit("global", options)
  },

  // Get current rate limit status without incrementing
  async getRateLimitStatus(identifier: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    const { window = DEFAULT_WINDOW, max = DEFAULT_MAX } = options

    if (!isRedisEnabled() || process.env.ENABLE_RATE_LIMITING !== "true") {
      return {
        allowed: true,
        remaining: max,
        resetTime: Date.now() + window * 1000,
        total: max,
      }
    }

    try {
      const redis = getRedis()
      if (!redis) {
        return {
          allowed: true,
          remaining: max,
          resetTime: Date.now() + window * 1000,
          total: max,
        }
      }

      const now = Date.now()
      const windowStart = Math.floor(now / (window * 1000)) * (window * 1000)
      const key = `${RATE_LIMIT_PREFIX}${identifier}:${windowStart}`

      const count = (await redis.get(key)) || "0"
      const ttl = await redis.ttl(key)

      const resetTime = ttl > 0 ? now + ttl * 1000 : windowStart + window * 1000
      const remaining = Math.max(0, max - Number.parseInt(count))
      const allowed = Number.parseInt(count) < max

      return {
        allowed,
        remaining,
        resetTime,
        total: max,
      }
    } catch (err) {
      console.error("Rate limit status error:", err)
      return {
        allowed: true,
        remaining: max,
        resetTime: Date.now() + window * 1000,
        total: max,
      }
    }
  },

  // Reset rate limit for identifier
  async resetRateLimit(identifier: string, window: number = DEFAULT_WINDOW): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const now = Date.now()
      const windowStart = Math.floor(now / (window * 1000)) * (window * 1000)
      const key = `${RATE_LIMIT_PREFIX}${identifier}:${windowStart}`

      await redis.del(key)
      return true
    } catch (err) {
      console.error("Rate limit reset error:", err)
      return false
    }
  },

  // Get rate limit statistics
  async getRateLimitStats(): Promise<{
    totalKeys: number
    activeWindows: number
    topIdentifiers: Array<{ identifier: string; count: number }>
  }> {
    if (!isRedisEnabled()) {
      return { totalKeys: 0, activeWindows: 0, topIdentifiers: [] }
    }

    try {
      const redis = getRedis()
      if (!redis) return { totalKeys: 0, activeWindows: 0, topIdentifiers: [] }

      const pattern = `${RATE_LIMIT_PREFIX}*`
      const keys = await redis.keys(pattern)
      const totalKeys = keys.length

      // Count active windows (keys with TTL)
      let activeWindows = 0
      const identifierCounts: Record<string, number> = {}

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl > 0) {
          activeWindows++

          // Extract identifier from key
          const identifier = key.replace(RATE_LIMIT_PREFIX, "").split(":").slice(0, -1).join(":")
          const count = Number.parseInt((await redis.get(key)) || "0")

          if (identifierCounts[identifier]) {
            identifierCounts[identifier] += count
          } else {
            identifierCounts[identifier] = count
          }
        }
      }

      // Get top identifiers
      const topIdentifiers = Object.entries(identifierCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([identifier, count]) => ({ identifier, count }))

      return { totalKeys, activeWindows, topIdentifiers }
    } catch (err) {
      console.error("Rate limit stats error:", err)
      return { totalKeys: 0, activeWindows: 0, topIdentifiers: [] }
    }
  },

  // Clean up expired rate limit keys
  async cleanupExpiredKeys(): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      const pattern = `${RATE_LIMIT_PREFIX}*`
      const keys = await redis.keys(pattern)
      let cleaned = 0

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
      console.error("Rate limit cleanup error:", err)
      return 0
    }
  },
}

export default rateLimiter
