export const runtime = "nodejs"

import { getRedis, isRedisEnabled } from "./client"
import { REDIS_CONFIG } from "./config"

export interface RateLimitOptions {
  window: number // Time window in seconds
  max: number // Maximum requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  total: number
}

export const rateLimiter = {
  async checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    if (!isRedisEnabled() || !REDIS_CONFIG.features.enableRateLimit) {
      return {
        allowed: true,
        remaining: options.max,
        resetTime: Date.now() + options.window * 1000,
        total: options.max,
      }
    }

    try {
      const redis = getRedis()
      if (!redis) {
        return {
          allowed: true,
          remaining: options.max,
          resetTime: Date.now() + options.window * 1000,
          total: options.max,
        }
      }

      const now = Date.now()
      const windowStart = Math.floor(now / (options.window * 1000)) * options.window
      const rateLimitKey = `${REDIS_CONFIG.keyPrefixes.rateLimit}${key}:${windowStart}`

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()
      pipeline.incr(rateLimitKey)
      pipeline.expire(rateLimitKey, options.window)

      const results = await pipeline.exec()
      const count = (results?.[0]?.[1] as number) || 0

      const remaining = Math.max(0, options.max - count)
      const resetTime = (windowStart + options.window) * 1000

      return {
        allowed: count <= options.max,
        remaining,
        resetTime,
        total: options.max,
      }
    } catch (err) {
      console.error("Rate limit check error:", err)
      // Fail open - allow the request if Redis is down
      return {
        allowed: true,
        remaining: options.max,
        resetTime: Date.now() + options.window * 1000,
        total: options.max,
      }
    }
  },

  // IP-based rate limiting
  async checkIPRateLimit(ip: string, options?: Partial<RateLimitOptions>): Promise<RateLimitResult> {
    const rateLimitOptions: RateLimitOptions = {
      window: options?.window || REDIS_CONFIG.rateLimit.window,
      max: options?.max || REDIS_CONFIG.rateLimit.max,
    }

    return await this.checkRateLimit(`ip:${ip}`, rateLimitOptions)
  },

  // User-based rate limiting
  async checkUserRateLimit(userId: string, options?: Partial<RateLimitOptions>): Promise<RateLimitResult> {
    const rateLimitOptions: RateLimitOptions = {
      window: options?.window || REDIS_CONFIG.rateLimit.window,
      max: options?.max || REDIS_CONFIG.rateLimit.max,
    }

    return await this.checkRateLimit(`user:${userId}`, rateLimitOptions)
  },

  // API endpoint rate limiting
  async checkEndpointRateLimit(
    endpoint: string,
    identifier: string,
    options?: Partial<RateLimitOptions>,
  ): Promise<RateLimitResult> {
    const rateLimitOptions: RateLimitOptions = {
      window: options?.window || REDIS_CONFIG.rateLimit.window,
      max: options?.max || REDIS_CONFIG.rateLimit.max,
    }

    return await this.checkRateLimit(`endpoint:${endpoint}:${identifier}`, rateLimitOptions)
  },

  // Reset rate limit for a specific key
  async resetRateLimit(key: string): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const pattern = `${REDIS_CONFIG.keyPrefixes.rateLimit}${key}:*`
      const keys = await redis.keys(pattern)

      if (keys.length > 0) {
        await redis.del(...keys)
      }

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
    topLimitedKeys: Array<{ key: string; count: number }>
  }> {
    if (!isRedisEnabled()) {
      return {
        totalKeys: 0,
        activeWindows: 0,
        topLimitedKeys: [],
      }
    }

    try {
      const redis = getRedis()
      if (!redis) {
        return {
          totalKeys: 0,
          activeWindows: 0,
          topLimitedKeys: [],
        }
      }

      const pattern = `${REDIS_CONFIG.keyPrefixes.rateLimit}*`
      const keys = await redis.keys(pattern)

      const topLimitedKeys: Array<{ key: string; count: number }> = []

      for (const key of keys.slice(0, 10)) {
        // Only check top 10 for performance
        try {
          const count = await redis.get(key)
          if (count) {
            const cleanKey = key.replace(REDIS_CONFIG.keyPrefixes.rateLimit, "")
            topLimitedKeys.push({
              key: cleanKey,
              count: Number.parseInt(count, 10),
            })
          }
        } catch (err) {
          // Skip individual key errors
        }
      }

      // Sort by count descending
      topLimitedKeys.sort((a, b) => b.count - a.count)

      return {
        totalKeys: keys.length,
        activeWindows: keys.length,
        topLimitedKeys: topLimitedKeys.slice(0, 5), // Return top 5
      }
    } catch (err) {
      console.error("Rate limit stats error:", err)
      return {
        totalKeys: 0,
        activeWindows: 0,
        topLimitedKeys: [],
      }
    }
  },

  // Cleanup expired rate limit entries
  async cleanupExpiredRateLimits(): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      let cleaned = 0
      const pattern = `${REDIS_CONFIG.keyPrefixes.rateLimit}*`
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
      console.error("Rate limit cleanup error:", err)
      return 0
    }
  },
}

export default rateLimiter
