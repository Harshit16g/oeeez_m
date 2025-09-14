import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"
import type { User } from "@supabase/supabase-js"

export interface SessionData {
  userId: string
  sessionId: string
  user: User
  createdAt: string
  lastActivity: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: any
  metadata?: any
}

class SessionManager {
  private getSessionKey(sessionId: string): string {
    return `${REDIS_CONFIG.keyPrefixes.session}${sessionId}`
  }

  private getUserSessionsKey(userId: string): string {
    return `${REDIS_CONFIG.keyPrefixes.session}user:${userId}`
  }

  public async createSession(sessionId: string, user: User, metadata?: any): Promise<SessionData | null> {
    if (!REDIS_CONFIG.features.enableCache) {
      return null
    }

    try {
      const sessionData: SessionData = {
        userId: user.id,
        sessionId,
        user,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata,
      }

      const sessionKey = this.getSessionKey(sessionId)
      const userSessionsKey = this.getUserSessionsKey(user.id)

      // Store session data
      await redisClient.set(sessionKey, sessionData, REDIS_CONFIG.ttl.session)

      // Add to user's session list
      const client = redisClient.getClient()
      if (client) {
        await client.sadd(userSessionsKey, sessionId)
        await client.expire(userSessionsKey, REDIS_CONFIG.ttl.session)
      }

      console.log(`📝 Session created: ${sessionId} for user ${user.id}`)
      return sessionData
    } catch (error) {
      console.error("Failed to create session:", error)
      return null
    }
  }

  public async getSession(sessionId: string): Promise<SessionData | null> {
    if (!REDIS_CONFIG.features.enableCache) {
      return null
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redisClient.get<SessionData>(sessionKey)

      if (sessionData) {
        // Update last activity
        await this.updateLastActivity(sessionId)
      }

      return sessionData
    } catch (error) {
      console.error("Failed to get session:", error)
      return null
    }
  }

  public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    if (!REDIS_CONFIG.features.enableCache) {
      return
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const existingSession = await redisClient.get<SessionData>(sessionKey)

      if (existingSession) {
        const updatedSession = {
          ...existingSession,
          ...updates,
          lastActivity: new Date().toISOString(),
        }

        await redisClient.set(sessionKey, updatedSession, REDIS_CONFIG.ttl.session)
      }
    } catch (error) {
      console.error("Failed to update session:", error)
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (!REDIS_CONFIG.features.enableCache) {
      return
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redisClient.get<SessionData>(sessionKey)

      if (sessionData) {
        const userSessionsKey = this.getUserSessionsKey(sessionData.userId)

        // Remove from user's session list
        const client = redisClient.getClient()
        if (client) {
          await client.srem(userSessionsKey, sessionId)
        }
      }

      // Delete session data
      await redisClient.del(sessionKey)

      console.log(`🗑️ Session deleted: ${sessionId}`)
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  public async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!REDIS_CONFIG.features.enableCache) {
      return []
    }

    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const client = redisClient.getClient()

      if (!client) {
        return []
      }

      const sessionIds = await client.smembers(userSessionsKey)
      const sessions: SessionData[] = []

      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId)
        if (sessionData) {
          sessions.push(sessionData)
        }
      }

      return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    } catch (error) {
      console.error("Failed to get user sessions:", error)
      return []
    }
  }

  public async deleteAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    if (!REDIS_CONFIG.features.enableCache) {
      return
    }

    try {
      const sessions = await this.getUserSessions(userId)

      for (const session of sessions) {
        if (session.sessionId !== exceptSessionId) {
          await this.deleteSession(session.sessionId)
        }
      }

      console.log(`🧹 Deleted all sessions for user ${userId} except ${exceptSessionId || "none"}`)
    } catch (error) {
      console.error("Failed to delete user sessions:", error)
    }
  }

  private async updateLastActivity(sessionId: string): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        lastActivity: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to update last activity:", error)
    }
  }

  public async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    userCount: number
  }> {
    try {
      const pattern = `${REDIS_CONFIG.keyPrefixes.session}*`
      const keys = await redisClient.keys(pattern)

      // Filter out user session lists (they contain "user:" in the key)
      const sessionKeys = keys.filter((key) => !key.includes("user:"))
      const userKeys = keys.filter((key) => key.includes("user:"))

      return {
        totalSessions: sessionKeys.length,
        activeSessions: sessionKeys.length, // All stored sessions are considered active
        userCount: userKeys.length,
      }
    } catch (error) {
      console.error("Failed to get session stats:", error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        userCount: 0,
      }
    }
  }
}

export const sessionManager = new SessionManager()
export default sessionManager
