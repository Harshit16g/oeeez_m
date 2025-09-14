import { type NextRequest, NextResponse } from "next/server"
import { healthCheck } from "@/lib/redis/client"

export async function GET(request: NextRequest) {
  try {
    const health = await healthCheck()

    return NextResponse.json({
      redis: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Redis health check failed:", error)

    return NextResponse.json(
      {
        redis: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
