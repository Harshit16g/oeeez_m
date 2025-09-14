import Redis from "ioredis"

// Redis configuration interface
interface RedisConfig {
  connection: {
    url?: string
    connectTimeout: number
    commandTimeout: number
    retryDelayOnFailover: number
    enableReadyCheck: boolean
    maxRetriesPerRequest: number
    lazyConnect: boolean
    keepAlive: number
    family: number
  }
  cache: {
    defaultTTL: number
    shortTTL: number
    mediumTTL: number
    longTTL: number
    prefix: string
  }
  session: {
    ttl: number
    prefix: string
  }
  rateLimit: {
    prefix: string
  }
}

// Default Redis configuration
const REDIS_CONFIG: RedisConfig = {
  connection: {
    url: process.env.REDIS_URL,
    connectTimeout: Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT || "10000"),
    commandTimeout: Number.parseInt(process.env.REDIS_COMMAND_TIMEOUT || "5000"),
    retryDelayOnFailover: Number.parseInt(process.env.REDIS_RETRY_DELAY || "100"),
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    maxRetriesPerRequest: Number.parseInt(process.env.REDIS_MAX_RETRIES || "3"),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === "true",
    keepAlive: Number.parseInt(process.env.REDIS_KEEP_ALIVE || "30000"),
    family: Number.parseInt(process.env.REDIS_FAMILY || "4"),
  },
  cache: {
    defaultTTL: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"),
    shortTTL: Number.parseInt(process.env.CACHE_TTL_SHORT || "300"),
    mediumTTL: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"),
    longTTL: Number.parseInt(process.env.CACHE_TTL_LONG || "7200"),
    prefix: process.env.REDIS_CACHE_PREFIX || "artistly:cache:",
  },
  session: {
    ttl: Number.parseInt(process.env.SESSION_TTL || "86400"),
    prefix: process.env.REDIS_SESSION_PREFIX || "artistly:session:",
  },
  rateLimit: {
    prefix: process.env.REDIS_RATE_LIMIT_PREFIX || "artistly:ratelimit:",
  },
}

class RedisClient {
  private static instance: RedisClient
  private redis: Redis | null = null
  private connected = false
  private enabled = false

  private constructor() {
    this.enabled = process.env.ENABLE_REDIS_CACHE === "true" && !!process.env.REDIS_URL
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public async connect(): Promise<Redis | null> {
    if (!this.enabled) {
      console.log("⚠️ Redis is disabled or URL not provided")
      return null
    }

    if (this.redis && this.connected) {
      return this.redis
    }

    try {
      this.redis = new Redis(REDIS_CONFIG.connection.url!, {
        connectTimeout: REDIS_CONFIG.connection.connectTimeout,
        commandTimeout: REDIS_CONFIG.connection.commandTimeout,
        retryDelayOnFailover: REDIS_CONFIG.connection.retryDelayOnFailover,
        enableReadyCheck: REDIS_CONFIG.connection.enableReadyCheck,
        maxRetriesPerRequest: REDIS_CONFIG.connection.maxRetriesPerRequest,
        lazyConnect: REDIS_CONFIG.connection.lazyConnect,
        keepAlive: REDIS_CONFIG.connection.keepAlive,
        family: REDIS_CONFIG.connection.family,
      })

      // Event listeners
      this.redis.on("connect", () => {
        console.log("✅ Redis connected")
        this.connected = true
      })

      this.redis.on("ready", () => {
        console.log("✅ Redis ready")
      })

      this.redis.on("error", (error) => {
        console.error("❌ Redis error:", error)
        this.connected = false
      })

      this.redis.on("close", () => {
        console.log("🔌 Redis connection closed")
        this.connected = false
      })

      this.redis.on("reconnecting", () => {
        console.log("🔄 Redis reconnecting...")
      })

      // Connect if not using lazy connect
      if (!REDIS_CONFIG.connection.lazyConnect) {
        await this.redis.connect()
      }

      return this.redis
    } catch (error) {
      console.error("Failed to connect to Redis:", error)
      this.enabled = false
      return null
    }
  }

  public async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
      this.connected = false
    }
  }

  public getClient(): Redis | null {
    return this.redis
  }

  public isConnected(): boolean {
    return this.enabled && this.connected && this.redis?.status === "ready"
  }

  public async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    if (!this.enabled) {
      return {
        status: "disabled",
        error: "Redis is disabled",
      }
    }

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) {
        return {
          status: "unhealthy",
          error: "Failed to connect to Redis",
        }
      }

      const start = Date.now()
      await this.redis.ping()
      const latency = Date.now() - start

      return {
        status: "healthy",
        latency,
      }
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Helper methods with safety checks
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled) return

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return

      const serializedValue = JSON.stringify(value)

      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue)
      } else {
        await this.redis.set(key, serializedValue)
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error)
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.enabled) return null

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return null

      const value = await this.redis.get(key)

      if (value === null) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error)
      return null
    }
  }

  public async del(key: string | string[]): Promise<number> {
    if (!this.enabled) return 0

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return 0

      if (Array.isArray(key)) {
        return await this.redis.del(...key)
      } else {
        return await this.redis.del(key)
      }
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error)
      return 0
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return false

      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error)
      return false
    }
  }

  public async expire(key: string, ttl: number): Promise<void> {
    if (!this.enabled) return

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return

      await this.redis.expire(key, ttl)
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error)
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.enabled) return []

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return []

      return await this.redis.keys(pattern)
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error)
      return []
    }
  }

  public async flushall(): Promise<void> {
    if (!this.enabled) return

    try {
      if (!this.redis) {
        await this.connect()
      }

      if (!this.redis) return

      await this.redis.flushall()
    } catch (error) {
      console.error("Redis FLUSHALL error:", error)
    }
  }
}

export const redisClient = RedisClient.getInstance()

// Initialize Redis connection - EXPORTED FUNCTION
export async function initializeRedis(): Promise<void> {
  try {
    // Only initialize Redis if it's enabled and we have a URL
    if (!process.env.REDIS_URL || process.env.ENABLE_REDIS_CACHE !== "true") {
      console.log("⚠️ Redis disabled or URL not provided")
      return
    }

    await redisClient.connect()
    console.log("🚀 Redis initialization completed")
  } catch (error) {
    console.error("❌ Redis initialization failed:", error)
    // Don't throw error to prevent app from crashing
    // The app should work without Redis, just with reduced performance
  }
}

// Graceful shutdown
export async function shutdownRedis(): Promise<void> {
  try {
    await redisClient.disconnect()
    console.log("✅ Redis shutdown completed")
  } catch (error) {
    console.error("❌ Redis shutdown failed:", error)
  }
}

export { REDIS_CONFIG }
export default redisClient
