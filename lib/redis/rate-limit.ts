import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (identifier: string) => string
}

class RateLimiter {
  private getKey(identifier: string, prefix = "default"): string {
    return `${REDIS_CONFIG.keyPrefixes.rateLimit}${prefix}:${identifier}`
  }

  public async checkLimit(identifier: string, config: RateLimitConfig, prefix = "default"): Promise<RateLimitResult> {
    if (!REDIS_CONFIG.features.enableRateLimit) {
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      }
    }

    try {
      const key = this.getKey(identifier, prefix)
      const now = Date.now()
      const windowStart = now - config.windowMs

      // Use Redis sliding window log
      const redis = redisClient.getClient()
      if (!redis) {
        throw new Error("Redis client not available")
      }

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart)

      // Count current requests
      const currentRequests = await redis.zcard(key)

      const allowed = currentRequests < config.maxRequests
      const remaining = Math.max(0, config.maxRequests - currentRequests)
      const resetTime = now + config.windowMs

      if (allowed) {
        // Add current request
        await redis.zadd(key, now, now)
        await redis.expire(key, Math.ceil(config.windowMs / 1000))
      }

      return {
        allowed,
        limit: config.maxRequests,
        remaining: allowed ? remaining - 1 : remaining,
        resetTime,
      }
    } catch (error) {
      console.error("Rate limit check error:", error)
      // On error, allow the request (fail open)
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      }
    }
  }

  // Predefined rate limit configurations
  public readonly configs = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    },
    signup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
    },
  }

  // Convenience methods for common rate limits
  public async checkLoginLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkLimit(identifier, this.configs.login, "login")
  }

  public async checkSignupLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkLimit(identifier, this.configs.signup, "signup")
  }

  public async checkPasswordResetLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkLimit(identifier, this.configs.passwordReset, "password_reset")
  }

  public async checkApiLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkLimit(identifier, this.configs.api, "api")
  }

  public async checkSearchLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkLimit(identifier, this.configs.search, "search")
  }

  // Reset rate limit for identifier
  public async resetLimit(identifier: string, prefix = "default"): Promise<void> {
    try {
      const key = this.getKey(identifier, prefix)
      await redisClient.del(key)
    } catch (error) {
      console.error("Failed to reset rate limit:", error)
    }
  }

  // Get current rate limit info
  public async getLimitInfo(
    identifier: string,
    config: RateLimitConfig,
    prefix = "default",
  ): Promise<{ current: number; limit: number; resetTime: number }> {
    try {
      const key = this.getKey(identifier, prefix)
      const now = Date.now()
      const windowStart = now - config.windowMs

      const redis = redisClient.getClient()
      if (!redis) {
        return { current: 0, limit: config.maxRequests, resetTime: now + config.windowMs }
      }

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart)

      // Count current requests
      const current = await redis.zcard(key)

      return {
        current,
        limit: config.maxRequests,
        resetTime: now + config.windowMs,
      }
    } catch (error) {
      console.error("Failed to get rate limit info:", error)
      return { current: 0, limit: config.maxRequests, resetTime: Date.now() + config.windowMs }
    }
  }
}

export const rateLimiter = new RateLimiter()
export default rateLimiter
