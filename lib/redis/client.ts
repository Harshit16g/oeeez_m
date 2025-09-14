export const runtime = "nodejs"

import Redis from "ioredis"

let redis: Redis | null = null

export function initializeRedis(): Redis | null {
  if (redis) return redis

  if (process.env.ENABLE_REDIS_CACHE !== "true") {
    console.warn("⚠️ Redis disabled via environment variable")
    return null
  }

  if (!process.env.REDIS_URL) {
    console.warn("⚠️ Redis URL not provided")
    return null
  }

  try {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT ?? 10000),
      commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT ?? 5000),
      keepAlive: Number(process.env.REDIS_KEEP_ALIVE ?? 30000),
      enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
      family: Number(process.env.REDIS_FAMILY ?? 4),
      retryDelayOnFailover: Number(process.env.REDIS_RETRY_DELAY ?? 100),
      retryStrategy: (times) => Math.min(times * (Number(process.env.REDIS_RETRY_DELAY) || 200), 2000),
    })

    redis.on("connect", () => console.log("✅ Redis connected"))
    redis.on("ready", () => console.log("✅ Redis ready"))
    redis.on("error", (err) => console.error("❌ Redis error:", err))
    redis.on("close", () => console.log("🔌 Redis connection closed"))
    redis.on("reconnecting", () => console.log("🔄 Redis reconnecting..."))

    return redis
  } catch (err) {
    console.error("❌ Redis initialization failed:", err)
    return null
  }
}

export function getRedis(): Redis | null {
  if (!redis) return initializeRedis()
  return redis
}

export async function safeGet<T = any>(key: string): Promise<T | null> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return null

  try {
    const client = getRedis()
    if (!client) return null

    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    console.error("Redis GET error:", err)
    return null
  }
}

export async function safeSet(key: string, value: any, ttl?: number): Promise<boolean> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return false

  try {
    const client = getRedis()
    if (!client) return false

    const serializedValue = JSON.stringify(value)

    if (ttl) {
      await client.setex(key, ttl, serializedValue)
    } else {
      await client.set(key, serializedValue)
    }

    return true
  } catch (err) {
    console.error("Redis SET error:", err)
    return false
  }
}

export async function safeDel(key: string | string[]): Promise<boolean> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return false

  try {
    const client = getRedis()
    if (!client) return false

    if (Array.isArray(key)) {
      await client.del(...key)
    } else {
      await client.del(key)
    }

    return true
  } catch (err) {
    console.error("Redis DEL error:", err)
    return false
  }
}

export async function safeExists(key: string): Promise<boolean> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return false

  try {
    const client = getRedis()
    if (!client) return false

    const result = await client.exists(key)
    return result === 1
  } catch (err) {
    console.error("Redis EXISTS error:", err)
    return false
  }
}

export async function safeExpire(key: string, ttl: number): Promise<boolean> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return false

  try {
    const client = getRedis()
    if (!client) return false

    await client.expire(key, ttl)
    return true
  } catch (err) {
    console.error("Redis EXPIRE error:", err)
    return false
  }
}

export async function safeKeys(pattern: string): Promise<string[]> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") return []

  try {
    const client = getRedis()
    if (!client) return []

    return await client.keys(pattern)
  } catch (err) {
    console.error("Redis KEYS error:", err)
    return []
  }
}

export async function healthCheck(): Promise<{
  status: "healthy" | "unhealthy" | "disabled"
  latency?: number
  error?: string
}> {
  if (process.env.ENABLE_REDIS_CACHE !== "true") {
    return { status: "disabled" }
  }

  try {
    const client = getRedis()
    if (!client) {
      return { status: "unhealthy", error: "Redis client not initialized" }
    }

    const start = Date.now()
    await client.ping()
    const latency = Date.now() - start

    return { status: "healthy", latency }
  } catch (err) {
    return {
      status: "unhealthy",
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export async function shutdownRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit()
      redis = null
      console.log("✅ Redis shutdown completed")
    } catch (err) {
      console.error("❌ Redis shutdown failed:", err)
    }
  }
}
