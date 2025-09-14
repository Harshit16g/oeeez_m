import { getRedis, isRateLimitEnabled } from "./client"
import { REDIS_CONFIG, CACHE_KEYS } from "./config"

export const runtime = "nodejs"

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export async function checkRateLimit(
  identifier: string,
  limit: number = REDIS_CONFIG.RATE_LIMIT_MAX,
  window: number = REDIS_CONFIG.RATE_LIMIT_WINDOW,
): Promise<RateLimitResult> {
  if (!isRateLimitEnabled) {
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: Date.now() + window * 1000,
    }
  }

  try {
    const redis = await getRedis()
    if (!redis) {
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTime: Date.now() + window * 1000,
      }
    }

    const key = CACHE_KEYS.RATE_LIMIT(identifier)
    const now = Date.now()
    const windowStart = now - window * 1000

    // Use sliding window log approach
    const pipeline = redis.pipeline()

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Count current requests
    pipeline.zcard(key)

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)

    // Set expiration
    pipeline.expire(key, window)

    const results = await pipeline.exec()

    if (!results) {
      throw new Error("Pipeline execution failed")
    }

    const currentCount = (results[1][1] as number) || 0
    const remaining = Math.max(0, limit - currentCount - 1)
    const resetTime = now + window * 1000

    return {
      success: currentCount < limit,
      limit,
      remaining,
      resetTime,
    }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: Date.now() + window * 1000,
    }
  }
}

export async function resetRateLimit(identifier: string): Promise<boolean> {
  if (!isRateLimitEnabled) {
    return true
  }

  try {
    const redis = await getRedis()
    if (!redis) return true

    const key = CACHE_KEYS.RATE_LIMIT(identifier)
    await redis.del(key)
    return true
  } catch (error) {
    console.error("Failed to reset rate limit:", error)
    return false
  }
}
