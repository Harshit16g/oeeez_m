import { NextResponse } from "next/server"
import { getCacheStats } from "@/lib/redis/cache"

export const runtime = "nodejs"

export async function GET() {
  try {
    const stats = await getCacheStats()

    if (!stats) {
      return NextResponse.json({
        message: "Cache stats not available (Redis disabled or metrics disabled)",
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
