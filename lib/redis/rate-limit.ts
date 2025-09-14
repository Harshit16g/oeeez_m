export const runtime = "nodejs"

import { getRedis } from "./client"

const RATE_LIMIT_PREFIX = process.env.REDIS_RATE_LIMIT_PREFIX || "rate:"
const DEFAULT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW ?? 60000) // 1 minute
const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 100)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

export async function checkRateLimit(
  key: string,
  limit: number = DEFAULT_MAX,
  windowMs: number = DEFAULT_WINDOW,
): Promise<RateLimitResult> {
  const defaultResult: RateLimitResult = {
    allowed: true,
    remaining: limit,
    resetTime: Date.now() + windowMs,
    totalHits: 0,
  }

  if (process.env.ENABLE_RATE_LIMITING !== "true") {
    return defaultResult
  }

  try {
    const redis = getRedis()
    if (!redis) return defaultResult

    const now = Date.now()
    const windowStart = now - windowMs
    const rateLimitKey = `${RATE_LIMIT_PREFIX}${key}`

    // Use Redis sorted set to track requests in the time window
    // Remove expired entries
    await redis.zremrangebyscore(rateLimitKey, 0, windowStart)

    // Count current requests in window
    const currentRequests = await redis.zcard(rateLimitKey)

    // Add current request
    await redis.zadd(rateLimitKey, now, `${now}-${Math.random()}`)

    // Set expiration for the key
    await redis.expire(rateLimitKey, Math.ceil(windowMs / 1000))

    const allowed = currentRequests < limit
    const remaining = Math.max(0, limit - currentRequests - 1)
    const resetTime = now + windowMs

    return {
      allowed,
      remaining,
      resetTime,
      totalHits: currentRequests + 1,
    }
  } catch (err) {
    console.error(`Rate limit check error for ${key}:`, err)
    return defaultResult
  }
}

export async function resetRateLimit(key: string): Promise<boolean> {
  if (process.env.ENABLE_RATE_LIMITING !== "true") return false

  try {
    const redis = getRedis()
    if (!redis) return false

    const rateLimitKey = `${RATE_LIMIT_PREFIX}${key}`
    await redis.del(rateLimitKey)
    return true
  } catch (err) {
    console.error(`Rate limit reset error for ${key}:`, err)
    return false
  }
}

export async function getRemainingRequests(
  key: string,
  limit: number = DEFAULT_MAX,
  windowMs: number = DEFAULT_WINDOW,
): Promise<number> {
  if (process.env.ENABLE_RATE_LIMITING !== "true") return limit

  try {
    const redis = getRedis()
    if (!redis) return limit

    const now = Date.now()
    const windowStart = now - windowMs
    const rateLimitKey = `${RATE_LIMIT_PREFIX}${key}`

    // Remove expired entries and count current requests
    await redis.zremrangebyscore(rateLimitKey, 0, windowStart)
    const currentRequests = await redis.zcard(rateLimitKey)

    return Math.max(0, limit - currentRequests)
  } catch (err) {
    console.error(`Get remaining requests error for ${key}:`, err)
    return limit
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  signup: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  search: { limit: 30, windowMs: 60 * 1000 }, // 30 searches per minute
  upload: { limit: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
}

// Convenience functions for common rate limits
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.login
  return checkRateLimit(`login:${identifier}`, config.limit, config.windowMs)
}

export async function checkSignupRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.signup
  return checkRateLimit(`signup:${identifier}`, config.limit, config.windowMs)
}

export async function checkPasswordResetRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.passwordReset
  return checkRateLimit(`password_reset:${identifier}`, config.limit, config.windowMs)
}

export async function checkApiRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.api
  return checkRateLimit(`api:${identifier}`, config.limit, config.windowMs)
}

export async function checkSearchRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.search
  return checkRateLimit(`search:${identifier}`, config.limit, config.windowMs)
}

export async function checkUploadRateLimit(identifier: string): Promise<RateLimitResult> {
  const config = rateLimitConfigs.upload
  return checkRateLimit(`upload:${identifier}`, config.limit, config.windowMs)
}

export async function getRateLimitStats(): Promise<{
  enabled: boolean
  totalKeys: number
  activeWindows: number
}> {
  const stats = {
    enabled: process.env.ENABLE_RATE_LIMITING === "true",
    totalKeys: 0,
    activeWindows: 0,
  }

  if (!stats.enabled) return stats

  try {
    const redis = getRedis()
    if (!redis) return stats

    const pattern = `${RATE_LIMIT_PREFIX}*`
    const keys = await redis.keys(pattern)
    stats.totalKeys = keys.length

    // Count active windows (keys with unexpired entries)
    const now = Date.now()
    for (const key of keys) {
      const count = await redis.zcard(key)
      if (count > 0) {
        stats.activeWindows++
      }
    }
  } catch (err) {
    console.error("Rate limit stats error:", err)
  }

  return stats
}
