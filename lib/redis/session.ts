export const runtime = "nodejs"

import { getRedis } from "./client"

const SESSION_PREFIX = process.env.REDIS_SESSION_PREFIX || "session:"
const USER_PREFIX = process.env.REDIS_USER_PREFIX || "user:"
const SESSION_TTL = Number(process.env.SESSION_TTL ?? 86400)
const MAX_SESSIONS_PER_USER = Number(process.env.MAX_SESSIONS_PER_USER ?? 5)

export interface SessionData {
  userId: string
  email: string
  accessToken: string
  refreshToken?: string
  expiresAt: number
  createdAt: number
  lastActivity: number
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export async function createSession(
  userId: string,
  sessionData: Omit<SessionData, "createdAt" | "lastActivity">,
): Promise<string | null> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return null

  try {
    const redis = getRedis()
    if (!redis) return null

    const now = Date.now()
    const sessionId = `${SESSION_PREFIX}${userId}:${now}`
    const userSessionsKey = `${USER_PREFIX}${userId}:sessions`

    const fullSessionData: SessionData = {
      ...sessionData,
      createdAt: now,
      lastActivity: now,
    }

    // Store the session
    await redis.setex(sessionId, SESSION_TTL, JSON.stringify(fullSessionData))

    // Manage user sessions list
    const userSessions = await redis.lrange(userSessionsKey, 0, -1)

    // Add new session to user's session list
    await redis.lpush(userSessionsKey, sessionId)
    await redis.expire(userSessionsKey, SESSION_TTL)

    // Enforce max sessions per user
    if (userSessions.length >= MAX_SESSIONS_PER_USER) {
      const sessionsToRemove = userSessions.slice(MAX_SESSIONS_PER_USER - 1)
      for (const oldSessionId of sessionsToRemove) {
        await redis.del(oldSessionId)
        await redis.lrem(userSessionsKey, 1, oldSessionId)
      }
    }

    console.log(`📝 Session created: ${sessionId} for user ${userId}`)
    return sessionId
  } catch (err) {
    console.error("Redis createSession error:", err)
    return null
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return null

  try {
    const redis = getRedis()
    if (!redis) return null

    const data = await redis.get(sessionId)
    if (!data) return null

    const sessionData: SessionData = JSON.parse(data)

    // Update last activity
    sessionData.lastActivity = Date.now()
    await redis.setex(sessionId, SESSION_TTL, JSON.stringify(sessionData))

    return sessionData
  } catch (err) {
    console.error("Redis getSession error:", err)
    return null
  }
}

export async function updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return false

  try {
    const redis = getRedis()
    if (!redis) return false

    const existingData = await redis.get(sessionId)
    if (!existingData) return false

    const sessionData: SessionData = JSON.parse(existingData)
    const updatedData: SessionData = {
      ...sessionData,
      ...updates,
      lastActivity: Date.now(),
    }

    await redis.setex(sessionId, SESSION_TTL, JSON.stringify(updatedData))
    return true
  } catch (err) {
    console.error("Redis updateSession error:", err)
    return false
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return false

  try {
    const redis = getRedis()
    if (!redis) return false

    // Get session data to find user ID
    const sessionData = await getSession(sessionId)
    if (sessionData) {
      const userSessionsKey = `${USER_PREFIX}${sessionData.userId}:sessions`
      await redis.lrem(userSessionsKey, 1, sessionId)
    }

    // Delete the session
    await redis.del(sessionId)
    console.log(`🗑️ Session deleted: ${sessionId}`)
    return true
  } catch (err) {
    console.error("Redis deleteSession error:", err)
    return false
  }
}

export async function deleteUserSessions(userId: string, exceptSessionId?: string): Promise<boolean> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return false

  try {
    const redis = getRedis()
    if (!redis) return false

    const userSessionsKey = `${USER_PREFIX}${userId}:sessions`
    const sessionIds = await redis.lrange(userSessionsKey, 0, -1)

    // Delete all user sessions except the specified one
    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        await redis.del(sessionId)
        await redis.lrem(userSessionsKey, 1, sessionId)
      }
    }

    console.log(`🧹 Deleted all sessions for user ${userId} except ${exceptSessionId || "none"}`)
    return true
  } catch (err) {
    console.error("Redis deleteUserSessions error:", err)
    return false
  }
}

export async function getUserSessions(userId: string): Promise<SessionData[]> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return []

  try {
    const redis = getRedis()
    if (!redis) return []

    const userSessionsKey = `${USER_PREFIX}${userId}:sessions`
    const sessionIds = await redis.lrange(userSessionsKey, 0, -1)

    const sessions: SessionData[] = []
    for (const sessionId of sessionIds) {
      const sessionData = await getSession(sessionId)
      if (sessionData) {
        sessions.push(sessionData)
      }
    }

    return sessions.sort((a, b) => b.lastActivity - a.lastActivity)
  } catch (err) {
    console.error("Redis getUserSessions error:", err)
    return []
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return 0

  try {
    const redis = getRedis()
    if (!redis) return 0

    const pattern = `${SESSION_PREFIX}*`
    const keys = await redis.keys(pattern)
    let cleanedCount = 0

    for (const key of keys) {
      const sessionData = await getSession(key)
      if (sessionData && sessionData.expiresAt < Date.now()) {
        await deleteSession(key)
        cleanedCount++
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`)
    return cleanedCount
  } catch (err) {
    console.error("Session cleanup error:", err)
    return 0
  }
}

export async function getSessionStats(): Promise<{
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  userCount: number
}> {
  const stats = {
    totalSessions: 0,
    activeSessions: 0,
    expiredSessions: 0,
    userCount: 0,
  }

  if (process.env.ENABLE_REDIS_SESSIONS !== "true") return stats

  try {
    const redis = getRedis()
    if (!redis) return stats

    const sessionPattern = `${SESSION_PREFIX}*`
    const userPattern = `${USER_PREFIX}*:sessions`

    const sessionKeys = await redis.keys(sessionPattern)
    const userKeys = await redis.keys(userPattern)

    stats.totalSessions = sessionKeys.length
    stats.userCount = userKeys.length

    const now = Date.now()
    for (const key of sessionKeys) {
      const sessionData = await getSession(key)
      if (sessionData) {
        if (sessionData.expiresAt > now) {
          stats.activeSessions++
        } else {
          stats.expiredSessions++
        }
      }
    }
  } catch (err) {
    console.error("Session stats error:", err)
  }

  return stats
}
