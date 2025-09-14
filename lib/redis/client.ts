export const runtime = "nodejs"

import Redis from "ioredis"

let redis: Redis | null = null

export function initializeRedis(): Redis | null {
  if (redis) return redis

  if (process.env.ENABLE_REDIS_CACHE !== "true") {
    console.warn("⚠️ Redis disabled via ENABLE_REDIS_CACHE environment variable")
    return null
  }

  if (!process.env.REDIS_URL) {
    console.warn("⚠️ Redis disabled: REDIS_URL not provided")
    return null
  }

  try {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT ?? 10000),
      commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT ?? 5000),
      keepAlive: process.env.REDIS_KEEP_ALIVE === "true",
      enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
      retryStrategy: (times) => Math.min(times * (Number(process.env.REDIS_RETRY_DELAY) || 200), 2000),
      reconnectOnError: (err) => {
        const targetError = "READONLY"
        return err.message.includes(targetError)
      },
    })

    redis.on("connect", () => console.log("✅ Redis connected"))
    redis.on("ready", () => console.log("✅ Redis ready"))
    redis.on("error", (err) => console.error("❌ Redis error:", err.message))
    redis.on("close", () => console.log("⚠️ Redis connection closed"))
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

export function isRedisEnabled(): boolean {
  return process.env.ENABLE_REDIS_CACHE === "true" && !!process.env.REDIS_URL
}

// Safe Redis operations with error handling
export async function safeGet(key: string): Promise<string | null> {
  if (!isRedisEnabled()) return null

  try {
    const client = getRedis()
    if (!client) return null

    return await client.get(key)
  } catch (err) {
    console.error("Redis GET error:", err)
    return null
  }
}

export async function safeSet(key: string, value: string, ttl?: number): Promise<boolean> {
  if (!isRedisEnabled()) return false

  try {
    const client = getRedis()
    if (!client) return false

    if (ttl) {
      await client.setex(key, ttl, value)
    } else {
      await client.set(key, value)
    }
    return true
  } catch (err) {
    console.error("Redis SET error:", err)
    return false
  }
}

export async function safeDel(key: string): Promise<boolean> {
  if (!isRedisEnabled()) return false

  try {
    const client = getRedis()
    if (!client) return false

    await client.del(key)
    return true
  } catch (err) {
    console.error("Redis DEL error:", err)
    return false
  }
}

export async function safeExists(key: string): Promise<boolean> {
  if (!isRedisEnabled()) return false

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

export async function safeIncr(key: string): Promise<number | null> {
  if (!isRedisEnabled()) return null

  try {
    const client = getRedis()
    if (!client) return null

    return await client.incr(key)
  } catch (err) {
    console.error("Redis INCR error:", err)
    return null
  }
}

export async function safeExpire(key: string, seconds: number): Promise<boolean> {
  if (!isRedisEnabled()) return false

  try {
    const client = getRedis()
    if (!client) return false

    await client.expire(key, seconds)
    return true
  } catch (err) {
    console.error("Redis EXPIRE error:", err)
    return false
  }
}

// Health check function
export async function checkRedisHealth(): Promise<{ healthy: boolean; error?: string }> {
  if (!isRedisEnabled()) {
    return { healthy: false, error: "Redis is disabled" }
  }

  try {
    const client = getRedis()
    if (!client) {
      return { healthy: false, error: "Redis client not initialized" }
    }

    await client.ping()
    return { healthy: true }
  } catch (err) {
    return { healthy: false, error: (err as Error).message }
  }
}

export default getRedis
