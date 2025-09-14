export const runtime = "nodejs"

export const REDIS_CONFIG = {
  // Cache TTL settings
  DEFAULT_TTL: Number.parseInt(process.env.CACHE_TTL_DEFAULT || "3600"), // 1 hour
  USER_PROFILE_TTL: Number.parseInt(process.env.CACHE_TTL_USER_PROFILE || "1800"), // 30 minutes
  ANALYTICS_TTL: Number.parseInt(process.env.CACHE_TTL_ANALYTICS || "300"), // 5 minutes

  // Session settings
  SESSION_TTL: Number.parseInt(process.env.SESSION_TTL || "86400"), // 24 hours
  MAX_SESSIONS_PER_USER: Number.parseInt(process.env.MAX_SESSIONS_PER_USER || "5"),

  // Rate limiting
  RATE_LIMIT_WINDOW: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900"), // 15 minutes
  RATE_LIMIT_MAX: Number.parseInt(process.env.RATE_LIMIT_MAX || "100"),

  // Redis settings
  MAX_MEMORY_POLICY: process.env.REDIS_MAX_MEMORY_POLICY || "allkeys-lru",
  COMPRESSION_THRESHOLD: Number.parseInt(process.env.REDIS_COMPRESSION_THRESHOLD || "1024"), // 1KB

  // Feature flags
  ENABLE_CACHE: process.env.ENABLE_REDIS_CACHE === "true",
  ENABLE_SESSIONS: process.env.ENABLE_REDIS_SESSIONS === "true",
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === "true",
  ENABLE_LOGGING: process.env.ENABLE_ERROR_LOGGING === "true",

  // Debug
  DEBUG: process.env.REDIS_DEBUG === "true",
  METRICS: process.env.REDIS_METRICS === "true",
}

export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_SESSIONS: (userId: string) => `user:sessions:${userId}`,
  ANALYTICS: (key: string) => `analytics:${key}`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  CACHE_STATS: "cache:stats",
}
