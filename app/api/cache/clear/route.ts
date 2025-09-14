import { type NextRequest, NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

export async function POST(request: NextRequest) {
  try {
    const { key, pattern } = await request.json()

    if (key) {
      const success = await cacheManager.del(key)
      return NextResponse.json({
        success,
        message: success ? `Cache key '${key}' cleared` : `Failed to clear cache key '${key}'`,
      })
    }

    if (pattern) {
      // For now, just return a message since we don't have pattern deletion implemented
      return NextResponse.json({
        success: false,
        message: "Pattern-based cache clearing not implemented yet",
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Please provide either 'key' or 'pattern' parameter",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Cache clear failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
