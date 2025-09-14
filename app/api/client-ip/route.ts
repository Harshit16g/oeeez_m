import { type NextRequest, NextResponse } from "next/server"

// Force Node.js runtime
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // Get IP from various headers
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfConnectingIp = request.headers.get("cf-connecting-ip")

    // Priority order: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > fallback
    let ip = cfConnectingIp || realIp || forwarded?.split(",")[0] || "unknown"

    // Clean up the IP
    ip = ip.trim()

    return NextResponse.json({
      ip,
      headers: {
        "x-forwarded-for": forwarded,
        "x-real-ip": realIp,
        "cf-connecting-ip": cfConnectingIp,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ip: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
