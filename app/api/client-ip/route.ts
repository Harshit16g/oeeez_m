import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Try to get IP from various headers
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const cfIP = request.headers.get("cf-connecting-ip")

    let ip = "unknown"

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, get the first one
      ip = forwarded.split(",")[0].trim()
    } else if (realIP) {
      ip = realIP
    } else if (cfIP) {
      ip = cfIP
    } else if (request.ip) {
      ip = request.ip
    }

    return NextResponse.json({
      ip,
      headers: {
        forwarded,
        realIP,
        cfIP,
      },
    })
  } catch (error) {
    console.error("Error getting client IP:", error)
    return NextResponse.json({
      ip: "unknown",
      error: "Failed to determine IP",
    })
  }
}
