import { NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

export async function POST() {
  try {
    await cacheManager.clear()

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear cache",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
