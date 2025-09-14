import { NextResponse } from "next/server"
import { getRedis, isRedisEnabled } from "@/lib/redis/client"

export const runtime = "nodejs"

export async function GET() {
  try {
    if (!isRedisEnabled) {
      return NextResponse.json({
        status: "disabled",
        message: "Redis is disabled via environment variables",
        timestamp: new Date().toISOString(),
      })
    }

    const redis = await getRedis()

    if (!redis) {
      return NextResponse.json(
        {
          status: "unavailable",
          message: "Redis connection not available",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    // Test Redis connection
    const pingResult = await redis.ping()
    const info = await redis.info("server")

    return NextResponse.json({
      status: "healthy",
      ping: pingResult,
      server_info: info.split("\r\n").slice(0, 5).join("\n"),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
