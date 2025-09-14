import { NextResponse } from "next/server"
import { cacheManager } from "@/lib/redis/cache"

// Force Node.js runtime for Redis compatibility
export const runtime = "nodejs"

export async function GET() {
  try {
    const stats = await cacheManager.getStats()

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cache stats error:", error)
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

export async function DELETE() {
  try {
    await cacheManager.flush()

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
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
