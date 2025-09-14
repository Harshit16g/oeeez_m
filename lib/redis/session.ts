import { redisClient } from "./client"
import { REDIS_CONFIG } from "./config"

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

export interface SessionOptions {
  ttl?: number
  maxSessions?: number
}

export class SessionManager {
  private static instance: SessionManager
  private enabled: boolean

  private constructor() {
    this.enabled = process.env.ENABLE_REDIS_CACHE === "true"
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private getSessionKey(sessionId: string): string {
    return `${REDIS_CONFIG.session.prefix}${sessionId}`
  }

  private getUserSessionsKey(userId: string): string {
    return `${REDIS_CONFIG.session.prefix}user:${userId}`
  }

  public async createSession(
    sessionId: string,
    sessionData: Omit<SessionData, "createdAt" | "lastActivity">,
    options: SessionOptions = {},
  ): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const now = Date.now()
      const ttl = options.ttl || REDIS_CONFIG.session.ttl
      const maxSessions = options.maxSessions || Number.parseInt(process.env.MAX_SESSIONS_PER_USER || "5")

      const fullSessionData: SessionData = {
        ...sessionData,
        createdAt: now,
        lastActivity: now,
      }

      const sessionKey = this.getSessionKey(sessionId)
      const userSessionsKey = this.getUserSessionsKey(sessionData.userId)

      // Store the session
      await redisClient.set(sessionKey, fullSessionData, ttl)

      // Manage user sessions list
      const userSessions = (await redisClient.get<string[]>(userSessionsKey)) || []

      // Add new session to user's session list
      if (!userSessions.includes(sessionId)) {
        userSessions.push(sessionId)

        // Enforce max sessions per user
        if (userSessions.length > maxSessions) {
          const sessionsToRemove = userSessions.splice(0, userSessions.length - maxSessions)
          for (const oldSessionId of sessionsToRemove) {
            await this.deleteSession(oldSessionId)
          }
        }

        await redisClient.set(userSessionsKey, userSessions, ttl)
      }
    } catch (error) {
      console.error(`Session creation error for ${sessionId}:`, error)
    }
  }

  public async getSession(sessionId: string): Promise<SessionData | null> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return null
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redisClient.get<SessionData>(sessionKey)

      if (sessionData) {
        // Update last activity
        sessionData.lastActivity = Date.now()
        await redisClient.set(sessionKey, sessionData, REDIS_CONFIG.session.ttl)
      }

      return sessionData
    } catch (error) {
      console.error(`Session retrieval error for ${sessionId}:`, error)
      return null
    }
  }

  public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const existingSession = await redisClient.get<SessionData>(sessionKey)

      if (existingSession) {
        const updatedSession: SessionData = {
          ...existingSession,
          ...updates,
          lastActivity: Date.now(),
        }

        await redisClient.set(sessionKey, updatedSession, REDIS_CONFIG.session.ttl)
      }
    } catch (error) {
      console.error(`Session update error for ${sessionId}:`, error)
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const sessionKey = this.getSessionKey(sessionId)
      const sessionData = await redisClient.get<SessionData>(sessionKey)

      if (sessionData) {
        // Remove from user's session list
        const userSessionsKey = this.getUserSessionsKey(sessionData.userId)
        const userSessions = (await redisClient.get<string[]>(userSessionsKey)) || []
        const updatedSessions = userSessions.filter((id) => id !== sessionId)

        if (updatedSessions.length > 0) {
          await redisClient.set(userSessionsKey, updatedSessions, REDIS_CONFIG.session.ttl)
        } else {
          await redisClient.del(userSessionsKey)
        }
      }

      // Delete the session
      await redisClient.del(sessionKey)
    } catch (error) {
      console.error(`Session deletion error for ${sessionId}:`, error)
    }
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return
    }

    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const userSessions = (await redisClient.get<string[]>(userSessionsKey)) || []

      // Delete all user sessions
      for (const sessionId of userSessions) {
        const sessionKey = this.getSessionKey(sessionId)
        await redisClient.del(sessionKey)
      }

      // Delete user sessions list
      await redisClient.del(userSessionsKey)
    } catch (error) {
      console.error(`User sessions deletion error for ${userId}:`, error)
    }
  }

  public async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return []
    }

    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      const sessionIds = (await redisClient.get<string[]>(userSessionsKey)) || []

      const sessions: SessionData[] = []
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId)
        if (sessionData) {
          sessions.push(sessionData)
        }
      }

      return sessions
    } catch (error) {
      console.error(`Get user sessions error for ${userId}:`, error)
      return []
    }
  }

  public async cleanupExpiredSessions(): Promise<number> {
    if (!this.enabled || !redisClient.isEnabled()) {
      return 0
    }

    try {
      const pattern = `${REDIS_CONFIG.session.prefix}*`
      const keys = await redisClient.keys(pattern)
      let cleanedCount = 0

      for (const key of keys) {
        if (key.includes(":user:")) continue // Skip user session lists

        const sessionData = await redisClient.get<SessionData>(key)
        if (sessionData && sessionData.expiresAt < Date.now()) {
          const sessionId = key.replace(REDIS_CONFIG.session.prefix, "")
          await this.deleteSession(sessionId)
          cleanedCount++
        }
      }

      return cleanedCount
    } catch (error) {
      console.error("Session cleanup error:", error)
      return 0
    }
  }

  public async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    expiredSessions: number
  }> {
    const stats = {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
    }

    if (!this.enabled || !redisClient.isConnected()) {
      return stats
    }

    try {
      const pattern = `${REDIS_CONFIG.session.prefix}*`
      const keys = await redisClient.keys(pattern)
      const now = Date.now()

      for (const key of keys) {
        if (key.includes(":user:")) continue // Skip user session lists

        const sessionData = await redisClient.get<SessionData>(key)
        if (sessionData) {
          stats.totalSessions++
          if (sessionData.expiresAt > now) {
            stats.activeSessions++
          } else {
            stats.expiredSessions++
          }
        }
      }
    } catch (error) {
      console.error("Session stats error:", error)
    }

    return stats
  }
}

export const sessionManager = SessionManager.getInstance()
export default sessionManager
