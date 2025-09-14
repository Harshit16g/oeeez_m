export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { healthCheck } from "@/lib/redis/client"
import { getSessionStats } from "@/lib/redis/session"
import { getRateLimitStats } from "@/lib/redis/rate-limit"
import { cacheManager } from "@/lib/redis/cache"

export async function GET(request: NextRequest) {
  try {
    const [redisHealth, sessionStats, rateLimitStats, cacheStats] = await Promise.all([
      healthCheck(),
      getSessionStats(),
      getRateLimitStats(),
      cacheManager.getStats(),
    ])

    const healthData = {
      redis: redisHealth,
      sessions: sessionStats,
      rateLimit: rateLimitStats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
      environment: {
        enableRedisCache: process.env.ENABLE_REDIS_CACHE === "true",
        enableRedisSessions: process.env.ENABLE_REDIS_SESSIONS === "true",
        enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
        enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
      },
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    console.error("Redis health check error:", error)

    return NextResponse.json(
      {
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
