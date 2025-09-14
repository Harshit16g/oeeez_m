import { NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis/client"
import { redisConfig } from "@/lib/redis/config"

export const runtime = "nodejs"

export async function GET() {
  try {
    if (!redisConfig.enabled) {
      return NextResponse.json({
        enabled: false,
        message: "Redis caching is disabled",
        stats: null,
      })
    }

    const redis = await getRedisClient()

    if (!redis) {
      return NextResponse.json(
        {
          enabled: true,
          connected: false,
          message: "Redis not connected",
          stats: null,
        },
        { status: 500 },
      )
    }

    // Get Redis info
    const info = await redis.info("memory")
    const keyspace = await redis.info("keyspace")
    const stats = await redis.info("stats")

    // Parse memory info
    const memoryLines = info.split("\r\n")
    const memoryUsed = memoryLines.find((line) => line.startsWith("used_memory_human:"))?.split(":")[1]
    const memoryPeak = memoryLines.find((line) => line.startsWith("used_memory_peak_human:"))?.split(":")[1]

    // Parse keyspace info
    const keyspaceLines = keyspace.split("\r\n")
    const db0Info = keyspaceLines.find((line) => line.startsWith("db0:"))
    const totalKeys = db0Info ? Number.parseInt(db0Info.split("keys=")[1]?.split(",")[0] || "0") : 0

    // Parse stats info
    const statsLines = stats.split("\r\n")
    const totalConnections = statsLines.find((line) => line.startsWith("total_connections_received:"))?.split(":")[1]
    const totalCommands = statsLines.find((line) => line.startsWith("total_commands_processed:"))?.split(":")[1]

    return NextResponse.json({
      enabled: true,
      connected: true,
      stats: {
        memory: {
          used: memoryUsed,
          peak: memoryPeak,
        },
        keys: {
          total: totalKeys,
        },
        connections: {
          total: totalConnections,
        },
        commands: {
          total: totalCommands,
        },
      },
      config: {
        defaultTTL: redisConfig.defaultTTL,
        rateLimitEnabled: redisConfig.rateLimitEnabled,
        sessionEnabled: redisConfig.sessionEnabled,
      },
    })
  } catch (error) {
    console.error("Cache stats error:", error)

    return NextResponse.json(
      {
        enabled: true,
        connected: false,
        message: "Error getting cache stats",
        error: error instanceof Error ? error.message : "Unknown error",
        stats: null,
      },
      { status: 500 },
    )
  }
}
