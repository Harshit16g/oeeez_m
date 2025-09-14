import { getRedisClient } from "./client"
import { redisConfig } from "./config"

interface SessionData {
  userId: string
  email?: string
  loginTime: string
  lastActivity: string
  ipAddress?: string
  userAgent?: string
}

class SessionManager {
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  private getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`
  }

  async createSession(userId: string, sessionData: Partial<SessionData>): Promise<string | null> {
    if (!redisConfig.sessionEnabled) {
      return null
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return null

      const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const sessionKey = this.getSessionKey(sessionId)
      const userSessionsKey = this.getUserSessionsKey(userId)

      const session: SessionData = {
        userId,
        email: sessionData.email,
        loginTime: sessionData.loginTime || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
      }

      // Store session data
      await redis.setex(sessionKey, redisConfig.sessionTTL, JSON.stringify(session))

      // Add to user's session list
      await redis.sadd(userSessionsKey, sessionId)
      await redis.expire(userSessionsKey, redisConfig.sessionTTL)

      // Limit sessions per user
      const sessionCount = await redis.scard(userSessionsKey)
      if (sessionCount > redisConfig.maxSessionsPerUser) {
        const oldestSessions = await redis.srandmember(userSessionsKey, sessionCount - redisConfig.maxSessionsPerUser)
        if (Array.isArray(oldestSessions)) {
          for (const oldSession of oldestSessions) {
            await this.deleteSession(oldSession)
          }
        }
      }

      return sessionId
    } catch (error) {
      console.error("Error creating session:", error)
      return null
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!redisConfig.sessionEnabled) {
      return null
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return null

      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redis.get(sessionKey)

      if (!sessionData) return null

      const session = JSON.parse(sessionData) as SessionData

      // Update last activity
      session.lastActivity = new Date().toISOString()
      await redis.setex(sessionKey, redisConfig.sessionTTL, JSON.stringify(session))

      return session
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!redisConfig.sessionEnabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redis.get(sessionKey)

      if (sessionData) {
        const session = JSON.parse(sessionData) as SessionData
        const userSessionsKey = this.getUserSessionsKey(session.userId)

        // Remove from user's session list
        await redis.srem(userSessionsKey, sessionId)
      }

      // Delete session
      const result = await redis.del(sessionKey)
      return result > 0
    } catch (error) {
      console.error("Error deleting session:", error)
      return false
    }
  }

  async deleteAllUserSessions(userId: string): Promise<boolean> {
    if (!redisConfig.sessionEnabled) {
      return false
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return false

      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await redis.smembers(userSessionsKey)

      // Delete all sessions
      for (const sessionId of sessionIds) {
        const sessionKey = this.getSessionKey(sessionId)
        await redis.del(sessionKey)
      }

      // Clear user sessions list
      await redis.del(userSessionsKey)

      return true
    } catch (error) {
      console.error("Error deleting user sessions:", error)
      return false
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!redisConfig.sessionEnabled) {
      return []
    }

    try {
      const redis = await getRedisClient()
      if (!redis) return []

      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = await redis.smembers(userSessionsKey)

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    } catch (error) {
      console.error("Error getting user sessions:", error)
      return []
    }
  }
}

export const sessionManager = new SessionManager()
