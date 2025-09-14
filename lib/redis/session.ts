export const runtime = "nodejs"

import { getRedis, isRedisEnabled } from "./client"

const SESSION_PREFIX = process.env.REDIS_SESSION_PREFIX || "session:"
const USER_PREFIX = process.env.REDIS_USER_PREFIX || "user:"
const SESSION_TTL = Number(process.env.SESSION_TTL ?? 86400) // 24 hours
const MAX_SESSIONS_PER_USER = Number(process.env.MAX_SESSIONS_PER_USER ?? 5)

export interface SessionData {
  userId: string
  email?: string
  loginTime: string
  lastActivity: string
  userAgent?: string
  ipAddress?: string
  deviceInfo?: string
}

export const sessionManager = {
  async createSession(userId: string, sessionData: Partial<SessionData>): Promise<string | null> {
    if (!isRedisEnabled()) return null

    try {
      const redis = getRedis()
      if (!redis) return null

      const sessionId = `${SESSION_PREFIX}${userId}:${Date.now()}`
      const fullSessionData: SessionData = {
        userId,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ...sessionData,
      }

      // Store session data
      await redis.setex(sessionId, SESSION_TTL, JSON.stringify(fullSessionData))

      // Add to user's session list
      const userSessionsKey = `${USER_PREFIX}${userId}:sessions`
      await redis.lpush(userSessionsKey, sessionId)
      await redis.expire(userSessionsKey, SESSION_TTL)

      // Limit number of sessions per user
      await redis.ltrim(userSessionsKey, 0, MAX_SESSIONS_PER_USER - 1)

      return sessionId
    } catch (err) {
      console.error("Redis createSession error:", err)
      return null
    }
  },

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!isRedisEnabled()) return null

    try {
      const redis = getRedis()
      if (!redis) return null

      const data = await redis.get(sessionId)
      if (!data) return null

      const sessionData = JSON.parse(data) as SessionData

      // Update last activity
      sessionData.lastActivity = new Date().toISOString()
      await redis.setex(sessionId, SESSION_TTL, JSON.stringify(sessionData))

      return sessionData
    } catch (err) {
      console.error("Redis getSession error:", err)
      return null
    }
  },

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const existingData = await redis.get(sessionId)
      if (!existingData) return false

      const sessionData = JSON.parse(existingData) as SessionData
      const updatedData = {
        ...sessionData,
        ...updates,
        lastActivity: new Date().toISOString(),
      }

      await redis.setex(sessionId, SESSION_TTL, JSON.stringify(updatedData))
      return true
    } catch (err) {
      console.error("Redis updateSession error:", err)
      return false
    }
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      // Get session data to find user ID
      const sessionData = await redis.get(sessionId)
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as SessionData
        const userSessionsKey = `${USER_PREFIX}${parsed.userId}:sessions`
        await redis.lrem(userSessionsKey, 1, sessionId)
      }

      // Delete the session
      await redis.del(sessionId)
      return true
    } catch (err) {
      console.error("Redis deleteSession error:", err)
      return false
    }
  },

  async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!isRedisEnabled()) return []

    try {
      const redis = getRedis()
      if (!redis) return []

      const userSessionsKey = `${USER_PREFIX}${userId}:sessions`
      const sessionIds = await redis.lrange(userSessionsKey, 0, -1)

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId)
        if (sessionData) {
          sessions.push(sessionData)
        }
      }

      return sessions
    } catch (err) {
      console.error("Redis getUserSessions error:", err)
      return []
    }
  },

  async deleteAllUserSessions(userId: string): Promise<boolean> {
    if (!isRedisEnabled()) return false

    try {
      const redis = getRedis()
      if (!redis) return false

      const userSessionsKey = `${USER_PREFIX}${userId}:sessions`
      const sessionIds = await redis.lrange(userSessionsKey, 0, -1)

      // Delete all sessions
      for (const sessionId of sessionIds) {
        await redis.del(sessionId)
      }

      // Clear the session list
      await redis.del(userSessionsKey)
      return true
    } catch (err) {
      console.error("Redis deleteAllUserSessions error:", err)
      return false
    }
  },

  async cleanupExpiredSessions(): Promise<number> {
    if (!isRedisEnabled()) return 0

    try {
      const redis = getRedis()
      if (!redis) return 0

      let cleaned = 0
      const pattern = `${SESSION_PREFIX}*`
      const keys = await redis.keys(pattern)

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl === -1) {
          // Key exists but has no expiration, delete it
          await redis.del(key)
          cleaned++
        }
      }

      return cleaned
    } catch (err) {
      console.error("Redis cleanupExpiredSessions error:", err)
      return 0
    }
  },

  async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    expiredSessions: number
  }> {
    if (!isRedisEnabled()) {
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
    }

    try {
      const redis = getRedis()
      if (!redis) return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }

      const pattern = `${SESSION_PREFIX}*`
      const keys = await redis.keys(pattern)
      const totalSessions = keys.length

      let activeSessions = 0
      let expiredSessions = 0

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl > 0) {
          activeSessions++
        } else if (ttl === -1) {
          expiredSessions++
        }
      }

      return { totalSessions, activeSessions, expiredSessions }
    } catch (err) {
      console.error("Redis getSessionStats error:", err)
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
    }
  },
}

export default sessionManager
