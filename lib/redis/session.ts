import { getRedis } from "./client"
import { REDIS_CONFIG } from "./config"

export interface SessionData {
  userId: string
  email?: string
  loginTime: string
  lastActivity: string
  userAgent?: string
  ipAddress?: string
  deviceInfo?: string
  metadata?: Record<string, any>
}

export const sessionManager = {
  async createSession(userId: string, sessionData: Partial<SessionData>): Promise<string | null> {
    if (!REDIS_CONFIG.features.enableSessions) {
      console.log("⚠️ Redis sessions disabled")
      return null
    }

    try {
      const redis = await getRedis()
      if (!redis) return null

      const sessionId = `${REDIS_CONFIG.keyPrefixes.session}${userId}:${Date.now()}`
      const fullSessionData: SessionData = {
        userId,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ...sessionData,
      }

      await redis.setex(sessionId, REDIS_CONFIG.ttl.session, JSON.stringify(fullSessionData))

      const userSessionsKey = `${REDIS_CONFIG.keyPrefixes.user}${userId}:sessions`
      await redis.lpush(userSessionsKey, sessionId)
      await redis.expire(userSessionsKey, REDIS_CONFIG.ttl.session)
      await redis.ltrim(userSessionsKey, 0, REDIS_CONFIG.session.maxSessionsPerUser - 1)

      return sessionId
    } catch (err) {
      console.error("Redis createSession error:", err)
      return null
    }
  },

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!REDIS_CONFIG.features.enableSessions) return null

    try {
      const redis = await getRedis()
      if (!redis) return null

      const data = await redis.get(sessionId)
      if (!data) return null

      const sessionData = JSON.parse(data) as SessionData
      sessionData.lastActivity = new Date().toISOString()
      await redis.setex(sessionId, REDIS_CONFIG.ttl.session, JSON.stringify(sessionData))

      return sessionData
    } catch (err) {
      console.error("Redis getSession error:", err)
      return null
    }
  },

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableSessions) return false

    try {
      const redis = await getRedis()
      if (!redis) return false

      const existingData = await redis.get(sessionId)
      if (!existingData) return false

      const sessionData = JSON.parse(existingData) as SessionData
      const updatedData = {
        ...sessionData,
        ...updates,
        lastActivity: new Date().toISOString(),
      }

      await redis.setex(sessionId, REDIS_CONFIG.ttl.session, JSON.stringify(updatedData))
      return true
    } catch (err) {
      console.error("Redis updateSession error:", err)
      return false
    }
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!REDIS_CONFIG.features.enableSessions) return false

    try {
      const redis = await getRedis()
      if (!redis) return false

      const sessionData = await redis.get(sessionId)
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as SessionData
        const userSessionsKey = `${REDIS_CONFIG.keyPrefixes.user}${parsed.userId}:sessions`
        await redis.lrem(userSessionsKey, 1, sessionId)
      }

      await redis.del(sessionId)
      return true
    } catch (err) {
      console.error("Redis deleteSession error:", err)
      return false
    }
  },

  async getUserSessions(userId: string): Promise<SessionData[]> {
    if (!REDIS_CONFIG.features.enableSessions) return []

    try {
      const redis = await getRedis()
      if (!redis) return []

      const userSessionsKey = `${REDIS_CONFIG.keyPrefixes.user}${userId}:sessions`
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
    if (!REDIS_CONFIG.features.enableSessions) return false

    try {
      const redis = await getRedis()
      if (!redis) return false

      const userSessionsKey = `${REDIS_CONFIG.keyPrefixes.user}${userId}:sessions`
      const sessionIds = await redis.lrange(userSessionsKey, 0, -1)

      for (const sessionId of sessionIds) {
        await redis.del(sessionId)
      }

      await redis.del(userSessionsKey)
      return true
    } catch (err) {
      console.error("Redis deleteAllUserSessions error:", err)
      return false
    }
  },

  async cleanupExpiredSessions(): Promise<number> {
    if (!REDIS_CONFIG.features.enableSessions) return 0

    try {
      const redis = await getRedis()
      if (!redis) return 0

      let cleaned = 0
      const pattern = `${REDIS_CONFIG.keyPrefixes.session}*`
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
    if (!REDIS_CONFIG.features.enableSessions) {
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }
    }

    try {
      const redis = await getRedis()
      if (!redis) return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 }

      const pattern = `${REDIS_CONFIG.keyPrefixes.session}*`
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
