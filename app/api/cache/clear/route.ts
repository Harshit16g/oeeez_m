import { NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"
import { redisConfig } from "@/lib/redis/config"

export const runtime = "nodejs"

export async function POST() {
  try {
    if (!redisConfig.enabled) {
      return NextResponse.json({
        success: false,
        message: "Redis caching is disabled",
      })
    }

    const success = await cacheManager.flush()

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Cache cleared successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to clear cache",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Cache clear error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error clearing cache",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
