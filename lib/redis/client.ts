import Redis from "ioredis"
import { REDIS_CONFIG } from "./config"

class RedisClient {
  private static instance: RedisClient
  private redis: Redis | null = null
  private connected = false

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient()
    }
    return RedisClient.instance
  }

  public async connect(): Promise<Redis> {
    if (this.redis && this.connected) {
      return this.redis
    }

    try {
      if (!process.env.REDIS_URL) {
        throw new Error("REDIS_URL environment variable is not set")
      }

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
      throw error
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
    return this.connected && this.redis?.status === "ready"
  }

  public async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      const start = Date.now()
      await this.redis!.ping()
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

  // Helper methods
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      const serializedValue = JSON.stringify(value)

      if (ttl) {
        await this.redis!.setex(key, ttl, serializedValue)
      } else {
        await this.redis!.set(key, serializedValue)
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error)
      throw error
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      const value = await this.redis!.get(key)

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
    try {
      if (!this.redis) {
        await this.connect()
      }

      if (Array.isArray(key)) {
        return await this.redis!.del(...key)
      } else {
        return await this.redis!.del(key)
      }
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error)
      throw error
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      const result = await this.redis!.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error)
      return false
    }
  }

  public async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      await this.redis!.expire(key, ttl)
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error)
      throw error
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      return await this.redis!.keys(pattern)
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error)
      return []
    }
  }

  public async flushall(): Promise<void> {
    try {
      if (!this.redis) {
        await this.connect()
      }

      await this.redis!.flushall()
    } catch (error) {
      console.error("Redis FLUSHALL error:", error)
      throw error
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

export default redisClient
