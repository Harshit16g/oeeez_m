import { getRedisClient } from "./client"
import { redisConfig } from "./config"

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

class RateLimiter {
  private getRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`
  }

  async checkRateLimit(
    identifier: string,
    action = "default",
    maxRequests: number = redisConfig.rateLimitMax,
    windowSeconds: number = redisConfig.rateLimitWindow,
  ): Promise<RateLimitResult> {
    if (!redisConfig.rateLimitEnabled) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowSeconds * 1000,
      }
    }

    try {
      const redis = await getRedisClient()
      if (!redis) {
        return {
          allowed: true,
          remaining: maxRequests,
          resetTime: Date.now() + windowSeconds * 1000,
        }
      }

      const key = this.getRateLimitKey(identifier, action)
      const now = Date.now()
      const windowStart = now - windowSeconds * 1000

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart)

      // Count current requests
      const currentCount = await redis.zcard(key)

      if (currentCount >= maxRequests) {
        const oldestEntry = await redis.zrange(key, 0, 0, "WITHSCORES")
        const resetTime =
          oldestEntry.length > 0 ? Number.parseInt(oldestEntry[1]) + windowSeconds * 1000 : now + windowSeconds * 1000

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        }
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`)
      await redis.expire(key, windowSeconds)

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowSeconds * 1000,
      }
    } catch (error) {
      console.error("Rate limit check error:", error)
      // Allow request on error
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowSeconds * 1000,
      }
    }
  }

  async resetRateLimit(identifier: string, action = "default"): Promise<boolean> {
    if (!redisConfig.rateLimitEnabled) {
      return true
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const key = this.getRateLimitKey(identifier, action)
      const result = await redis.del(key)
      return result > 0
    } catch (error) {
      console.error("Rate limit reset error:", error)
      return false
    }
  }

  async getRateLimitStatus(
    identifier: string,
    action = "default",
  ): Promise<{
    currentCount: number
    resetTime: number
  }> {
    if (!redisConfig.rateLimitEnabled) {
      return {
        currentCount: 0,
        resetTime: Date.now() + redisConfig.rateLimitWindow * 1000,
      }
    }

    try {
      const redis = await getRedisClient()
      if (!redis) {
        return {
          currentCount: 0,
          resetTime: Date.now() + redisConfig.rateLimitWindow * 1000,
        }
      }

      const key = this.getRateLimitKey(identifier, action)
      const now = Date.now()
      const windowStart = now - redisConfig.rateLimitWindow * 1000

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart)

      // Get current count
      const currentCount = await redis.zcard(key)

      // Get oldest entry for reset time
      const oldestEntry = await redis.zrange(key, 0, 0, "WITHSCORES")
      const resetTime =
        oldestEntry.length > 0
          ? Number.parseInt(oldestEntry[1]) + redisConfig.rateLimitWindow * 1000
          : now + redisConfig.rateLimitWindow * 1000

      return {
        currentCount,
        resetTime,
      }
    } catch (error) {
      console.error("Rate limit status error:", error)
      return {
        currentCount: 0,
        resetTime: Date.now() + redisConfig.rateLimitWindow * 1000,
      }
    }
  }
}

export const rateLimiter = new RateLimiter()
