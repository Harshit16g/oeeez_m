import { getRedis } from "./client"
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
      const redis = getRedis()
      if (!redis) {
        return {
          allowed: true,
          limit: config.maxRequests,
          remaining: config.maxRequests,
          resetTime: Date.now() + config.windowMs,
        }
      }

      const key = this.getKey(identifier, prefix)
      const now = Date.now()
      const windowStart = now - config.windowMs

      await redis.zremrangebyscore(key, 0, windowStart)
      const currentRequests = await redis.zcard(key)

      const allowed = currentRequests < config.maxRequests
      const remaining = Math.max(0, config.maxRequests - currentRequests)
      const resetTime = now + config.windowMs

      if (allowed) {
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
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      }
    }
  }

  public readonly configs = {
    login: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    },
    signup: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    },
    api: {
      windowMs: 60 * 1000,
      maxRequests: 60,
    },
    search: {
      windowMs: 60 * 1000,
      maxRequests: 30,
    },
  }

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

  public async resetLimit(identifier: string, prefix = "default"): Promise<void> {
    try {
      const redis = getRedis()
      if (!redis) return

      const key = this.getKey(identifier, prefix)
      await redis.del(key)
    } catch (error) {
      console.error("Failed to reset rate limit:", error)
    }
  }

  public async getLimitInfo(
    identifier: string,
    config: RateLimitConfig,
    prefix = "default",
  ): Promise<{ current: number; limit: number; resetTime: number }> {
    try {
      const redis = getRedis()
      if (!redis) {
        return { current: 0, limit: config.maxRequests, resetTime: Date.now() + config.windowMs }
      }

      const key = this.getKey(identifier, prefix)
      const now = Date.now()
      const windowStart = now - config.windowMs

      await redis.zremrangebyscore(key, 0, windowStart)
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
