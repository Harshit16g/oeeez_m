// Redis configuration with safe defaults
export const REDIS_CONFIG = {
  features: {
    enableCache: process.env.ENABLE_REDIS_CACHE === "true",
    enableSessions: process.env.ENABLE_REDIS_SESSIONS === "true",
    enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
    enableLogging: process.env.ENABLE_ERROR_LOGGING === "true",
  },
  connection: {
    url: process.env.REDIS_URL || "",
    maxRetries: Number(process.env.REDIS_MAX_RETRIES ?? 3),
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT ?? 10000),
    commandTimeout: Number(process.env.REDIS_COMMAND_TIMEOUT ?? 5000),
    keepAlive: process.env.REDIS_KEEP_ALIVE === "true",
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    retryDelay: Number(process.env.REDIS_RETRY_DELAY ?? 200),
  },
  keyPrefixes: {
    cache: process.env.REDIS_CACHE_PREFIX || "cache:",
    session: process.env.REDIS_SESSION_PREFIX || "session:",
    user: process.env.REDIS_USER_PREFIX || "user:",
    rateLimit: process.env.REDIS_RATE_LIMIT_PREFIX || "rate_limit:",
    analytics: process.env.REDIS_ANALYTICS_PREFIX || "analytics:",
  },
  ttl: {
    cache: Number(process.env.CACHE_TTL_DEFAULT ?? 3600), // 1 hour
    session: Number(process.env.SESSION_TTL ?? 86400), // 24 hours
    userProfile: Number(process.env.CACHE_TTL_USER_PROFILE ?? 1800), // 30 minutes
    analytics: Number(process.env.CACHE_TTL_ANALYTICS ?? 300), // 5 minutes
    rateLimit: Number(process.env.RATE_LIMIT_WINDOW ?? 900), // 15 minutes
  },
  session: {
    maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER ?? 5),
  },
  rateLimit: {
    maxRequests: Number(process.env.RATE_LIMIT_MAX ?? 100),
    windowMs: Number(process.env.RATE_LIMIT_WINDOW ?? 900000), // 15 minutes
  },
  cache: {
    maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || "allkeys-lru",
    compressionThreshold: Number(process.env.REDIS_COMPRESSION_THRESHOLD ?? 1024),
  },
}

export default REDIS_CONFIG
