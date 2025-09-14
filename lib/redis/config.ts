export const redisConfig = {
  enabled: process.env.ENABLE_REDIS_CACHE === "true",
  rateLimitEnabled: process.env.ENABLE_RATE_LIMITING === "true",
  sessionEnabled: process.env.ENABLE_REDIS_SESSIONS === "true",
  errorLoggingEnabled: process.env.ENABLE_ERROR_LOGGING === "true",

  // Cache TTL settings
  defaultTTL: Number.parseInt(process.env.CACHE_TTL_DEFAULT || "3600"), // 1 hour
  userProfileTTL: Number.parseInt(process.env.CACHE_TTL_USER_PROFILE || "1800"), // 30 minutes
  analyticsTTL: Number.parseInt(process.env.CACHE_TTL_ANALYTICS || "300"), // 5 minutes

  // Rate limiting settings
  rateLimitWindow: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900"), // 15 minutes
  rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX || "100"),

  // Session settings
  maxSessionsPerUser: Number.parseInt(process.env.MAX_SESSIONS_PER_USER || "5"),
  sessionTTL: Number.parseInt(process.env.SESSION_TTL || "86400"), // 24 hours

  // Redis connection settings
  url: process.env.REDIS_URL || "",
  maxRetries: 3,
  retryDelay: 1000,
}

export function validateRedisConfig() {
  if (redisConfig.enabled && !redisConfig.url) {
    console.warn("Redis is enabled but REDIS_URL is not set")
    return false
  }
  return true
}
