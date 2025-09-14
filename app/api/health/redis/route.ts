import { NextResponse } from "next/server"
import { healthCheck } from "@/lib/redis/client"

export async function GET() {
  try {
    const health = await healthCheck()

    return NextResponse.json({
      redis: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        redis: { status: "error", error: "Health check failed" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
