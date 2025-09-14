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

    // Parse request body to determine what to clear
    const body = await request.json().catch(() => ({}))
    const { type, key, tag } = body

    let result: any = { success: false }

    switch (type) {
      case "all":
        const cleared = await cacheManager.clearAllCache()
        result = { success: cleared, message: "All cache cleared" }
        break

      case "key":
        if (!key) {
          return NextResponse.json({ error: "Key is required" }, { status: 400 })
        }
        const keyCleared = await cacheManager.del(key)
        result = { success: keyCleared, message: `Key '${key}' cleared` }
        break

      case "tag":
        if (!tag) {
          return NextResponse.json({ error: "Tag is required" }, { status: 400 })
        }
        const tagCount = await cacheManager.invalidateByTag(tag)
        result = { success: tagCount > 0, message: `${tagCount} entries cleared for tag '${tag}'` }
        break

      case "user":
        if (!key) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }
        await cacheManager.invalidateUser(key)
        result = { success: true, message: `User cache cleared for '${key}'` }
        break

      case "artist":
        if (!key) {
          return NextResponse.json({ error: "Artist ID is required" }, { status: 400 })
        }
        await cacheManager.invalidateArtist(key)
        result = { success: true, message: `Artist cache cleared for '${key}'` }
        break

      default:
        return NextResponse.json({ error: "Invalid clear type" }, { status: 400 })
    }

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      rateLimitRemaining: rateLimitResult.remaining,
    })
  } catch (error) {
    console.error("Cache clear error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
