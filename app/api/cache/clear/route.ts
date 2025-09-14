export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"
import { rateLimiter } from "@/lib/redis/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitResult = await rateLimiter.checkIPRateLimit(clientIP, {
      window: 3600, // 1 hour
      max: 10, // 10 cache clears per hour
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetTime: rateLimitResult.resetTime,
        },
        { status: 429 },
      )
    }

    await cacheManager.clear()

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
      rateLimitRemaining: rateLimitResult.remaining,
    })
  } catch (error) {
    console.error("Cache clear error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
