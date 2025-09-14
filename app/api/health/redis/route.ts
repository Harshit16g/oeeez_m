export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { checkRedisHealth } from "@/lib/redis/client"
import { cacheManager } from "@/lib/redis/cache"
import { sessionManager } from "@/lib/redis/session"
import { rateLimiter } from "@/lib/redis/rate-limit"

export async function GET(request: NextRequest) {
  try {
    // Check if Redis is enabled
    if (process.env.ENABLE_REDIS_CACHE !== "true") {
      return NextResponse.json(
        {
          status: "disabled",
          message: "Redis is disabled via environment variable",
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      )
    }

    // Check Redis connection health
    const healthCheck = await checkRedisHealth()

    if (!healthCheck.healthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: healthCheck.error,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    // Get comprehensive Redis statistics
    const [cacheStats, sessionStats, rateLimitStats] = await Promise.all([
      cacheManager.getCacheStats(),
      sessionManager.getSessionStats(),
      rateLimiter.getRateLimitStats(),
    ])

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        stats: {
          cache: cacheStats,
          sessions: sessionStats,
          rateLimit: rateLimitStats,
        },
        config: {
          cacheEnabled: process.env.ENABLE_REDIS_CACHE === "true",
          sessionsEnabled: process.env.ENABLE_REDIS_SESSIONS === "true",
          rateLimitEnabled: process.env.ENABLE_RATE_LIMITING === "true",
          redisUrl: process.env.REDIS_URL ? "configured" : "not configured",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Redis health check error:", error)

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
