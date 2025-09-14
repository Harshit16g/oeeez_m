export const REDIS_CONFIG = {
  // Feature flags
  features: {
    enableCache: process.env.ENABLE_REDIS_CACHE === "true",
    enableSessions: process.env.ENABLE_REDIS_SESSIONS === "true",
    enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
    enableLogging: process.env.ENABLE_ERROR_LOGGING === "true",
  },

  // Key prefixes
  keyPrefixes: {
    cache: process.env.REDIS_CACHE_PREFIX || "cache:",
    session: process.env.REDIS_SESSION_PREFIX || "session:",
    user: process.env.REDIS_USER_PREFIX || "user:",
    rateLimit: process.env.REDIS_RATE_LIMIT_PREFIX || "rate_limit:",
    tag: process.env.REDIS_TAG_PREFIX || "tag:",
    analytics: process.env.REDIS_ANALYTICS_PREFIX || "analytics:",
  },

  // TTL values in seconds
  ttl: {
    shortCache: Number(process.env.CACHE_TTL_SHORT) || 300, // 5 minutes
    mediumCache: Number(process.env.CACHE_TTL_MEDIUM) || 1800, // 30 minutes
    longCache: Number(process.env.CACHE_TTL_LONG) || 3600, // 1 hour
    userProfile: Number(process.env.CACHE_TTL_USER_PROFILE) || 1800, // 30 minutes
    artistData: Number(process.env.CACHE_TTL_ARTIST_DATA) || 3600, // 1 hour
    notifications: Number(process.env.CACHE_TTL_NOTIFICATIONS) || 300, // 5 minutes
    analytics: Number(process.env.CACHE_TTL_ANALYTICS) || 3600, // 1 hour
    session: Number(process.env.SESSION_TTL) || 86400, // 24 hours
  },

  // Connection settings
  connection: {
    maxRetries: Number(process.env.REDIS_MAX_RETRIES) || 3,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
    keepAlive: process.env.REDIS_KEEP_ALIVE === "true",
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    retryDelay: Number(process.env.REDIS_RETRY_DELAY) || 200,
  },

  // Rate limiting
  rateLimit: {
    window: Number(process.env.RATE_LIMIT_WINDOW) || 900, // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },

  // Session management
  session: {
    maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER) || 5,
  },

  // Logging
  logging: {
    enableDebug: process.env.REDIS_DEBUG === "true",
    enableMetrics: process.env.REDIS_METRICS === "true",
  },
}

export default REDIS_CONFIG
