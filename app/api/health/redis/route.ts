import { NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis/client"
import { redisConfig } from "@/lib/redis/config"

export const runtime = "nodejs"

export async function GET() {
  try {
    if (!redisConfig.enabled) {
      return NextResponse.json({
        status: "disabled",
        message: "Redis is disabled via environment variables",
        config: {
          enabled: false,
          rateLimitEnabled: redisConfig.rateLimitEnabled,
          sessionEnabled: redisConfig.sessionEnabled,
        },
      })
    }

    const redis = await getRedisClient()

    if (!redis) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to Redis",
          config: {
            enabled: redisConfig.enabled,
            url: redisConfig.url ? "configured" : "missing",
          },
        },
        { status: 500 },
      )
    }

    // Test Redis connection
    const pingResult = await redis.ping()
    const info = await redis.info("server")

    return NextResponse.json({
      status: "healthy",
      message: "Redis is connected and responding",
      ping: pingResult,
      serverInfo: info.split("\r\n").slice(0, 5).join("\n"),
      config: {
        enabled: redisConfig.enabled,
        rateLimitEnabled: redisConfig.rateLimitEnabled,
        sessionEnabled: redisConfig.sessionEnabled,
        defaultTTL: redisConfig.defaultTTL,
      },
    })
  } catch (error) {
    console.error("Redis health check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Redis health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        config: {
          enabled: redisConfig.enabled,
          url: redisConfig.url ? "configured" : "missing",
        },
      },
      { status: 500 },
    )
  }
}
