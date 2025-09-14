import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"
import type { User } from "@supabase/supabase-js"

export interface SessionData {
  userId: string
  email: string
  sessionId: string
  createdAt: string
  lastActivity: string
  expiresAt: string
  metadata?: {
    ip?: string
    userAgent?: string
    device?: string
    browser?: string
    os?: string
    isRemembered?: boolean
    [key: string]: any
  }
}

class SessionManager {
  private getSessionKey(sessionId: string): string {
    return `${REDIS_CONFIG.keyPrefixes.session}${sessionId}`
  }

  private getUserSessionsKey(userId: string): string {
    return `${REDIS_CONFIG.keyPrefixes.user}${userId}:sessions`
  }

  public async createSession(sessionId: string, user: User, metadata?: SessionData["metadata"]): Promise<SessionData> {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + REDIS_CONFIG.ttl.session * 1000)

      const sessionData: SessionData = {
        userId: user.id,
        email: user.email!,
        sessionId,
        createdAt: now.toISOString(),
        lastActivity: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        metadata: {
          ...metadata,
          userRole: user.role,
        },
      }

      // Store session data
      const sessionKey = this.getSessionKey(sessionId)
      await redisClient.set(sessionKey, sessionData, REDIS_CONFIG.ttl.session)

      // Add session to user's session list
      const userSessionsKey = this.getUserSessionsKey(user.id)
      await redisClient.getClient()?.sadd(userSessionsKey, sessionId)
      await redisClient.expire(userSessionsKey, REDIS_CONFIG.ttl.session)

      // Clean up old sessions if needed
      await this.cleanupUserSessions(user.id)

      console.log(`✅ Session created for user ${user.id}`)
      return sessionData
    } catch (error) {
      console.error("Failed to create session:", error)
      throw error
    }
  }

  public async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redisClient.get<SessionData>(sessionKey)

      if (!sessionData) {
        return null
      }

      // Check if session has expired
      const now = new Date()
      const expiresAt = new Date(sessionData.expiresAt)

      if (now > expiresAt) {
        await this.deleteSession(sessionId)
        return null
      }

      return sessionData
    } catch (error) {
      console.error("Failed to get session:", error)
      return null
    }
  }

  public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData | null> {
    try {
      const existingSession = await this.getSession(sessionId)
      if (!existingSession) {
        return null
      }

      const updatedSession: SessionData = {
        ...existingSession,
        ...updates,
        lastActivity: new Date().toISOString(),
      }

      const sessionKey = this.getSessionKey(sessionId)
      await redisClient.set(sessionKey, updatedSession, REDIS_CONFIG.ttl.session)

      return updatedSession
    } catch (error) {
      console.error("Failed to update session:", error)
      throw error
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    try {
      // Get session data to find user ID
      const sessionData = await this.getSession(sessionId)

      if (sessionData) {
        // Remove from user's session list
        const userSessionsKey = this.getUserSessionsKey(sessionData.userId)
        await redisClient.getClient()?.srem(userSessionsKey, sessionId)
      }

      // Delete session data
      const sessionKey = this.getSessionKey(sessionId)
      await redisClient.del(sessionKey)

      console.log(`🗑️ Session ${sessionId} deleted`)
    } catch (error) {
      console.error("Failed to delete session:", error)
      throw error
    }
  }

  public async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = (await redisClient.getClient()?.smembers(userSessionsKey)) || []

      const sessions: SessionData[] = []

      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId)
        if (sessionData) {
          sessions.push(sessionData)
        }
      }

      // Sort by last activity (most recent first)
      return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    } catch (error) {
      console.error("Failed to get user sessions:", error)
      return []
    }
  }

  public async deleteAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    try {
      const userSessions = await this.getUserSessions(userId)

      for (const session of userSessions) {
        if (exceptSessionId && session.sessionId === exceptSessionId) {
          continue
        }
        await this.deleteSession(session.sessionId)
      }

      console.log(`🗑️ All sessions deleted for user ${userId}`)
    } catch (error) {
      console.error("Failed to delete all user sessions:", error)
      throw error
    }
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId)

      if (sessions.length > REDIS_CONFIG.session.maxSessionsPerUser) {
        // Sort by creation date and remove oldest sessions
        const sortedSessions = sessions.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )

        const sessionsToRemove = sortedSessions.slice(0, sessions.length - REDIS_CONFIG.session.maxSessionsPerUser)

        for (const session of sessionsToRemove) {
          await this.deleteSession(session.sessionId)
        }

        console.log(`🧹 Cleaned up ${sessionsToRemove.length} old sessions for user ${userId}`)
      }
    } catch (error) {
      console.error("Failed to cleanup user sessions:", error)
    }
  }

  public async refreshSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData = await this.getSession(sessionId)
      if (!sessionData) {
        return null
      }

      const now = new Date()
      const newExpiresAt = new Date(now.getTime() + REDIS_CONFIG.ttl.session * 1000)

      return await this.updateSession(sessionId, {
        lastActivity: now.toISOString(),
        expiresAt: newExpiresAt.toISOString(),
      })
    } catch (error) {
      console.error("Failed to refresh session:", error)
      throw error
    }
  }

  public async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId)
      return sessionData !== null
    } catch (error) {
      console.error("Failed to validate session:", error)
      return false
    }
  }

  public async getActiveSessionsCount(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId)
      return sessions.length
    } catch (error) {
      console.error("Failed to get active sessions count:", error)
      return 0
    }
  }
}

export const sessionManager = new SessionManager()
export default sessionManager
