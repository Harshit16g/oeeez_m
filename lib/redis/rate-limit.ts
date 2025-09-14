import { getRedis } from "./client"
import { REDIS_CONFIG } from "./config"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export const rateLimiter = {
  async checkRateLimit(
    identifier: string,
    maxRequests: number = REDIS_CONFIG.rateLimit.maxRequests,
    windowMs: number = REDIS_CONFIG.rateLimit.windowMs,
  ): Promise<RateLimitResult> {
    if (!REDIS_CONFIG.features.enableRateLimit) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs,
        totalRequests: 0,
      }
    }

    try {
      const redis = await getRedis()
      if (!redis) {
        return {
          allowed: true,
          remaining: maxRequests,
          resetTime: Date.now() + windowMs,
          totalRequests: 0,
        }
      }

      const key = `${REDIS_CONFIG.keyPrefixes.rateLimit}${identifier}`
      const now = Date.now()
      const windowStart = now - windowMs

      // Use Redis sorted set to track requests in time window
      await redis.zremrangebyscore(key, 0, windowStart)
      const currentRequests = await redis.zcard(key)

      if (currentRequests >= maxRequests) {
        const resetTime = await redis.zrange(key, 0, 0, "WITHSCORES")
        const oldestRequest = resetTime.length > 1 ? Number.parseInt(resetTime[1]) : now

        return {
          allowed: false,
          remaining: 0,
          resetTime: oldestRequest + windowMs,
          totalRequests: currentRequests,
        }
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`)
      await redis.expire(key, Math.ceil(windowMs / 1000))

      return {
        allowed: true,
        remaining: maxRequests - currentRequests - 1,
        resetTime: now + windowMs,
        totalRequests: currentRequests + 1,
      }
    } catch (err) {
      console.error("Rate limit check error:", err)
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs,
        totalRequests: 0,
      }
    }
  },

  async resetRateLimit(identifier: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableRateLimit) return true

    try {
      const redis = await getRedis()
      if (!redis) return false

      const key = `${REDIS_CONFIG.keyPrefixes.rateLimit}${identifier}`
      await redis.del(key)
      return true
    } catch (err) {
      console.error("Rate limit reset error:", err)
      return false
    }
  },

  async getRateLimitInfo(identifier: string): Promise<{
    requests: number
    windowStart: number
    windowEnd: number
  }> {
    if (!REDIS_CONFIG.features.enableRateLimit) {
      return { requests: 0, windowStart: 0, windowEnd: 0 }
    }

    try {
      const redis = await getRedis()
      if (!redis) return { requests: 0, windowStart: 0, windowEnd: 0 }

      const key = `${REDIS_CONFIG.keyPrefixes.rateLimit}${identifier}`
      const now = Date.now()
      const windowStart = now - REDIS_CONFIG.rateLimit.windowMs

      await redis.zremrangebyscore(key, 0, windowStart)
      const requests = await redis.zcard(key)

      return {
        requests,
        windowStart,
        windowEnd: now,
      }
    } catch (err) {
      console.error("Rate limit info error:", err)
      return { requests: 0, windowStart: 0, windowEnd: 0 }
    }
  },
}

export default rateLimiter
