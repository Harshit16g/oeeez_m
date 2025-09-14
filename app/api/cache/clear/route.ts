import { NextResponse } from "next/server"
import { clearCache } from "@/lib/redis/cache"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { pattern } = await request.json().catch(() => ({}))

    const clearedCount = await clearCache(pattern)

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} cache entries`,
      pattern: pattern || "*",
      count: clearedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
