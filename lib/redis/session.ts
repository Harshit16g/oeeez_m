import { getRedis, isSessionEnabled } from "./client"
import { REDIS_CONFIG, CACHE_KEYS } from "./config"

export const runtime = "nodejs"

export interface SessionData {
  userId: string
  sessionId: string
  userAgent?: string
  ipAddress?: string
  createdAt: number
  lastActivity: number
  expiresAt: number
}

export const sessionManager = {
  async createSession(sessionData: SessionData): Promise<boolean> {
    if (!isSessionEnabled()) {
      return true // Fallback to default session handling
    }

    try {
      const redis = await getRedis()
      if (!redis) return true

      const sessionKey = `session:${sessionData.sessionId}`
      const userSessionsKey = CACHE_KEYS.USER_SESSIONS(sessionData.userId)

      // Store session data
      await redis.setex(sessionKey, REDIS_CONFIG.SESSION_TTL, JSON.stringify(sessionData))

      // Add to user's session list
      await redis.sadd(userSessionsKey, sessionData.sessionId)
      await redis.expire(userSessionsKey, REDIS_CONFIG.SESSION_TTL)

      // Cleanup old sessions if user has too many
      await cleanupUserSessions(sessionData.userId)

      return true
    } catch (error) {
      console.error("Failed to create session:", error)
      return true // Fallback gracefully
    }
  },

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!isSessionEnabled()) {
      return null
    }

    try {
      const redis = await getRedis()
      if (!redis) return null

      const sessionKey = `session:${sessionId}`
      const sessionData = await redis.get(sessionKey)

      if (!sessionData) return null

      const session: SessionData = JSON.parse(sessionData)

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(sessionId)
        return null
      }

      // Update last activity
      session.lastActivity = Date.now()
      await redis.setex(sessionKey, REDIS_CONFIG.SESSION_TTL, JSON.stringify(session))

      return session
    } catch (error) {
      console.error("Failed to get session:", error)
      return null
    }
  },

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    if (!isSessionEnabled()) return false

    try {
      const redis = await getRedis()
      if (!redis) return false

      const existingData = await redis.get(`session:${sessionId}`)
      if (!existingData) return false

      const sessionData = JSON.parse(existingData) as SessionData
      const updatedData = {
        ...sessionData,
        ...updates,
        lastActivity: Date.now(),
      }

      await redis.setex(`session:${sessionId}`, REDIS_CONFIG.SESSION_TTL, JSON.stringify(updatedData))
      return true
    } catch (err) {
      console.error("Redis updateSession error:", err)
      return false
    }
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!isSessionEnabled()) {
      return true
    }

    try {
      const redis = await getRedis()
      if (!redis) return true

      const sessionKey = `session:${sessionId}`

      // Get session to find user ID
      const sessionData = await redis.get(sessionKey)
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData)
        const userSessionsKey = CACHE_KEYS.USER_SESSIONS(session.userId)
        await redis.srem(userSessionsKey, sessionId)
      }

      await redis.del(sessionKey)
      return true
    } catch (error) {
      console.error("Failed to delete session:", error)
      return true
    }
  },

  async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!isSessionEnabled()) {
      return []
    }

    try {
      const redis = await getRedis()
      if (!redis) return []

      const userSessionsKey = CACHE_KEYS.USER_SESSIONS(userId)
      const sessionIds = await redis.smembers(userSessionsKey)

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions.sort((a, b) => b.lastActivity - a.lastActivity)
    } catch (error) {
      console.error("Failed to get user sessions:", error)
      return []
    }
  },

  async deleteAllUserSessions(userId: string): Promise<boolean> {
    if (!isSessionEnabled()) return false

    try {
      const redis = await getRedis()
      if (!redis) return false

      const userSessionsKey = CACHE_KEYS.USER_SESSIONS(userId)
      const sessionIds = await redis.smembers(userSessionsKey)

      for (const sessionId of sessionIds) {
        await redis.del(`session:${sessionId}`)
      }

      await redis.del(userSessionsKey)
      return true
    } catch (err) {
      console.error("Redis deleteAllUserSessions error:", err)
      return false
    }
  },

  async cleanupExpiredSessions(): Promise<number> {
    if (!isSessionEnabled()) return 0

    try {
      const redis = await getRedis()
      if (!redis) return 0

      let cleaned = 0
      const pattern = `session:*`
      const keys = await redis.keys(pattern)

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl === -1) {
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
    if (!isSessionEnabled()) {
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
    }

    try {
      const redis = await getRedis()
      if (!redis) return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }

      const pattern = `session:*`
      const keys = await redis.keys(pattern)
      const totalSessions = keys.length

      let activeSessions = 0
      let expiredSessions = 0

      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl > 0) {
          activeSessions++
        } else if (ttl === -2) {
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

async function cleanupUserSessions(userId: string): Promise<void> {
  try {
    const sessions = await sessionManager.getUserSessions(userId)

    if (sessions.length > REDIS_CONFIG.MAX_SESSIONS_PER_USER) {
      // Sort by last activity and remove oldest sessions
      const sessionsToRemove = sessions
        .sort((a, b) => a.lastActivity - b.lastActivity)
        .slice(0, sessions.length - REDIS_CONFIG.MAX_SESSIONS_PER_USER)

      for (const session of sessionsToRemove) {
        await sessionManager.deleteSession(session.sessionId)
      }
    }
  } catch (error) {
    console.error("Failed to cleanup user sessions:", error)
  }
}

export default sessionManager
