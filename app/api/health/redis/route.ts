import { NextResponse } from "next/server"
import { redisClient } from "@/lib/redis/client"

// Force Node.js runtime for Redis compatibility
export const runtime = "nodejs"

export async function GET() {
  try {
    const health = await redisClient.healthCheck()

    const response = {
      status: health.status,
      timestamp: new Date().toISOString(),
      latency: health.latency,
      connected: redisClient.isConnected(),
      redis_enabled: process.env.ENABLE_REDIS_CACHE === "true",
      redis_url_configured: !!process.env.REDIS_URL,
    }

    if (health.status === "healthy") {
      return NextResponse.json(response)
    } else {
      return NextResponse.json(response, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        connected: false,
        redis_enabled: process.env.ENABLE_REDIS_CACHE === "true",
        redis_url_configured: !!process.env.REDIS_URL,
      },
      { status: 503 },
    )
  }
}
