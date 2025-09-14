export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

export async function POST(request: NextRequest) {
  try {
    const { tag, pattern, all } = await request.json()

    let clearedCount = 0

    if (all) {
      const success = await cacheManager.flush()
      if (success) {
        const stats = await cacheManager.getStats()
        clearedCount = stats.cacheKeys
      }
    } else if (tag) {
      clearedCount = await cacheManager.invalidateByTag(tag)
    } else if (pattern) {
      clearedCount = await cacheManager.invalidateByPattern(pattern)
    } else {
      return NextResponse.json({ error: "Missing tag, pattern, or all parameter" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      clearedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cache clear error:", error)

    return NextResponse.json(
      {
        error: "Cache clear failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
