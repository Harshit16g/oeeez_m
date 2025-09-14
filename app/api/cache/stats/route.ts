import { NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

export async function GET() {
  try {
    const stats = await cacheManager.getStats()

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get cache stats",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
