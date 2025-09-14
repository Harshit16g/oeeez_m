import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"

export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

export class RateLimiter {
  private static instance: RateLimiter
  private enabled: boolean

  private constructor() {
    this.enabled = process.env.ENABLE_RATE_LIMITING === "true"
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  private getKey(identifier: string, keyGenerator?: (id: string) => string): string {
    if (keyGenerator) {
      return keyGenerator(identifier)
    }
    return `${REDIS_CONFIG.rateLimit.prefix}${identifier}`
  }

  public async checkLimit(identifier: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    const defaultResult: RateLimitResult = {
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      resetTime: Date.now(),
      totalHits: 0,
    }

    if (!this.enabled || !redisClient.isEnabled()) {
      return defaultResult
    }

    try {
      const windowMs = options.windowMs || REDIS_CONFIG.rateLimit.windowMs
      const maxRequests = options.maxRequests || REDIS_CONFIG.rateLimit.maxRequests
      const key = this.getKey(identifier, options.keyGenerator)

      const now = Date.now()
      const windowStart = now - windowMs

      // Use Redis sorted set to track requests in the time window
      const client = redisClient.getClient()
      if (!client) {
        return defaultResult
      }

      // Remove expired entries
      await client.zremrangebyscore(key, 0, windowStart)

      // Count current requests in window
      const currentRequests = await client.zcard(key)

      // Add current request
      await client.zadd(key, now, `${now}-${Math.random()}`)

      // Set expiration for the key
      await client.expire(key, Math.ceil(windowMs / 1000))

      const allowed = currentRequests < maxRequests
      const remaining = Math.max(0, maxRequests - currentRequests - 1)
      const resetTime = now + windowMs

      return {
        allowed,
        remaining,
        resetTime,
        totalHits: currentRequests + 1,
      }
    } catch (error) {
      console.error(`Rate limit check error for ${identifier}:`, error)
      return defaultResult
    }
  }

  public async resetLimit(identifier: string, options: RateLimitOptions = {}): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const key = this.getKey(identifier, options.keyGenerator)
      await redisClient.del(key)
    } catch (error) {
      console.error(`Rate limit reset error for ${identifier}:`, error)
    }
  }

  public async getRemainingRequests(identifier: string, options: RateLimitOptions = {}): Promise<number> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return Number.POSITIVE_INFINITY
    }

    try {
      const windowMs = options.windowMs || REDIS_CONFIG.rateLimit.windowMs
      const maxRequests = options.maxRequests || REDIS_CONFIG.rateLimit.maxRequests
      const key = this.getKey(identifier, options.keyGenerator)

      const now = Date.now()
      const windowStart = now - windowMs

      const client = redisClient.getClient()
      if (!client) {
        return Number.POSITIVE_INFINITY
      }

      // Remove expired entries and count current requests
      await client.zremrangebyscore(key, 0, windowStart)
      const currentRequests = await client.zcard(key)

      return Math.max(0, maxRequests - currentRequests)
    } catch (error) {
      console.error(`Get remaining requests error for ${identifier}:`, error)
      return Number.POSITIVE_INFINITY
    }
  }

  public async getStats(): Promise<{
    enabled: boolean
    totalKeys: number
    activeWindows: number
  }> {
    const stats = {
      enabled: this.enabled,
      totalKeys: 0,
      activeWindows: 0,
    }

    if (!this.enabled || !redisClient.isConnected()) {
      return stats
    }

    try {
      const pattern = `${REDIS_CONFIG.rateLimit.prefix}*`
      const keys = await redisClient.keys(pattern)
      stats.totalKeys = keys.length

      // Count active windows (keys with unexpired entries)
      const client = redisClient.getClient()
      if (client) {
        const now = Date.now()
        for (const key of keys) {
          const count = await client.zcard(key)
          if (count > 0) {
            stats.activeWindows++
          }
        }
      }
    } catch (error) {
      console.error("Rate limit stats error:", error)
    }

    return stats
  }
}

export const rateLimiter = RateLimiter.getInstance()

// Convenience function for common use cases
export async function checkRateLimit(identifier: string, options?: RateLimitOptions): Promise<RateLimitResult> {
  return rateLimiter.checkLimit(identifier, options)
}

export default rateLimiter
