export const runtime = "nodejs"

export const REDIS_CONFIG = {
  connection: {
    url: process.env.REDIS_URL,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT || "10000"),
    commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT || "5000"),
    retryDelayOnFailover: Number(process.env.REDIS_RETRY_DELAY || "100"),
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES || "3"),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === "true",
    keepAlive: Number(process.env.REDIS_KEEP_ALIVE || "30000"),
    family: Number(process.env.REDIS_FAMILY || "4"),
  },
  keyPrefixes: {
    cache: process.env.REDIS_CACHE_PREFIX || "cache:",
    session: process.env.REDIS_SESSION_PREFIX || "session:",
    rateLimit: process.env.REDIS_RATE_LIMIT_PREFIX || "rate:",
    tag: process.env.REDIS_TAG_PREFIX || "tag:",
    analytics: process.env.REDIS_ANALYTICS_PREFIX || "analytics:",
    user: process.env.REDIS_USER_PREFIX || "user:",
  },
  ttl: {
    short: Number(process.env.CACHE_TTL_SHORT || "300"), // 5 minutes
    medium: Number(process.env.CACHE_TTL_MEDIUM || "1800"), // 30 minutes
    long: Number(process.env.CACHE_TTL_LONG || "7200"), // 2 hours
    userProfile: Number(process.env.CACHE_TTL_USER_PROFILE || "3600"), // 1 hour
    artistData: Number(process.env.CACHE_TTL_ARTIST_DATA || "1800"), // 30 minutes
    notifications: Number(process.env.CACHE_TTL_NOTIFICATIONS || "300"), // 5 minutes
    session: Number(process.env.SESSION_TTL || "86400"), // 24 hours
    analytics: Number(process.env.CACHE_TTL_ANALYTICS || "3600"), // 1 hour
  },
  features: {
    enableCache: process.env.ENABLE_REDIS_CACHE === "true",
    enableSessions: process.env.ENABLE_REDIS_SESSIONS === "true",
    enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
    enableErrorLogging: process.env.ENABLE_ERROR_LOGGING === "true",
  },
  session: {
    maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER || "5"),
  },
  rateLimit: {
    window: Number(process.env.RATE_LIMIT_WINDOW || "3600"), // 1 hour
    max: Number(process.env.RATE_LIMIT_MAX || "100"),
  },
  cache: {
    maxCacheSize: Number(process.env.MAX_CACHE_SIZE || "1000000"), // 1MB
    maxKeyLength: Number(process.env.MAX_KEY_LENGTH || "250"),
    cleanupInterval: Number(process.env.CLEANUP_INTERVAL || "3600"), // 1 hour
    cleanupBatchSize: Number(process.env.CLEANUP_BATCH_SIZE || "100"),
  },
}

export default REDIS_CONFIG
