// Redis client with completely safe disabled mode - no imports at all
let redisInstance: any = null
let isInitialized = false
let isConnected = false

export const runtime = "nodejs"

const isRedisEnabled = process.env.ENABLE_REDIS_CACHE === "true"
const isRateLimitEnabled = process.env.ENABLE_RATE_LIMITING === "true"
const isSessionEnabled = process.env.ENABLE_REDIS_SESSIONS === "true"

export async function initializeRedis(): Promise<any> {
  if (isInitialized) return redisInstance

  if (!isRedisEnabled) {
    console.log("⚠️ Redis disabled via environment variables")
    isInitialized = true
    return null
  }

  if (typeof window !== "undefined") {
    // Don't initialize Redis on client side
    return
  }

  try {
    // Only import Redis if it's actually enabled
    const Redis = (await import("ioredis")).default

    const redisUrl = process.env.REDIS_URL
    if (!redisUrl || redisUrl.includes("your_redis_connection_string")) {
      console.log("Redis URL not configured, running without Redis")
      return null
    }

    redisInstance = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT ?? 10000),
      commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT ?? 5000),
      keepAlive: process.env.REDIS_KEEP_ALIVE === "true",
      enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
      retryStrategy: (times: number) => Math.min(times * 200, 2000),
      retryDelayOnFailover: 100,
    })

    redisInstance.on("connect", () => {
      console.log("✅ Redis connected")
      isConnected = true
    })

    redisInstance.on("ready", () => console.log("✅ Redis ready"))
    redisInstance.on("error", (err: Error) => {
      console.error("❌ Redis error:", err.message)
      isConnected = false
    })
    redisInstance.on("close", () => {
      console.log("⚠️ Redis connection closed")
      isConnected = false
    })
    redisInstance.on("reconnecting", () => console.log("🔄 Redis reconnecting..."))

    await redisInstance.ping()
    console.log("Redis connected successfully")
    isInitialized = true
    return redisInstance
  } catch (err) {
    console.error("❌ Redis initialization failed:", err)
    isInitialized = true
    return null
  }
}

export async function getRedis(): Promise<any> {
  if (!isInitialized) {
    return await initializeRedis()
  }
  return redisInstance
}

// Safe Redis operations that work when disabled
export async function safeGet(key: string): Promise<any> {
  if (!isRedisEnabled) return null

  try {
    const client = await getRedis()
    if (!client) return null

    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    console.error("Redis GET error:", err)
    return null
  }
}

export async function safeSet(key: string, value: any, ttl?: number): Promise<boolean> {
  if (!isRedisEnabled) return false

  try {
    const client = await getRedis()
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
  if (!isRedisEnabled) return false

  try {
    const client = await getRedis()
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
  if (!isRedisEnabled) return false

  try {
    const client = await getRedis()
    if (!client) return false

    const result = await client.exists(key)
    return result === 1
  } catch (err) {
    console.error("Redis EXISTS error:", err)
    return false
  }
}

export async function safeExpire(key: string, ttl: number): Promise<boolean> {
  if (!isRedisEnabled) return false

  try {
    const client = await getRedis()
    if (!client) return false

    await client.expire(key, ttl)
    return true
  } catch (err) {
    console.error("Redis EXPIRE error:", err)
    return false
  }
}

export async function safeKeys(pattern: string): Promise<string[]> {
  if (!isRedisEnabled) return []

  try {
    const client = await getRedis()
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
  if (!isRedisEnabled) {
    return { status: "disabled" }
  }

  try {
    const client = await getRedis()
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
  if (redisInstance) {
    try {
      await redisInstance.quit()
      redisInstance = null
      isConnected = false
      console.log("✅ Redis shutdown completed")
    } catch (err) {
      console.error("❌ Redis shutdown failed:", err)
    }
  }
}

export function isRedisAvailable() {
  return isRedisEnabled && isConnected
}

export default getRedis
