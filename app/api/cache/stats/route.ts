import { type NextRequest, NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

export async function GET(request: NextRequest) {
  try {
    const stats = await cacheManager.getCacheStats()

    return NextResponse.json({
      cache: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cache stats failed:", error)

    return NextResponse.json(
      {
        cache: {
          totalKeys: 0,
          memoryUsage: "0B",
          hitRate: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
