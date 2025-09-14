export const REDIS_CONFIG = {
  // Connection settings
  connection: {
    url: process.env.REDIS_URL,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4, // 4 (IPv4) or 6 (IPv6)
  },

  // TTL settings (in seconds)
  ttl: {
    session: Number.parseInt(process.env.SESSION_TTL || "86400"), // 24 hours
    shortCache: Number.parseInt(process.env.CACHE_TTL_SHORT || "300"), // 5 minutes
    mediumCache: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"), // 30 minutes
    longCache: Number.parseInt(process.env.CACHE_TTL_LONG || "7200"), // 2 hours
    userProfile: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"), // 30 minutes
    artistData: Number.parseInt(process.env.CACHE_TTL_LONG || "7200"), // 2 hours
    notifications: Number.parseInt(process.env.CACHE_TTL_SHORT || "300"), // 5 minutes
  },

  // Feature flags
  features: {
    enableCache: process.env.ENABLE_REDIS_CACHE === "true",
    enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
    enableErrorLogging: process.env.ENABLE_ERROR_LOGGING === "true",
  },

  // Session settings
  session: {
    maxSessionsPerUser: Number.parseInt(process.env.MAX_SESSIONS_PER_USER || "5"),
    cleanupInterval: 3600, // 1 hour
  },

  // Rate limiting settings
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },

  // Key prefixes
  keyPrefixes: {
    session: "session:",
    cache: "cache:",
    rateLimit: "rate_limit:",
    user: "user:",
    artist: "artist:",
    tag: "tag:",
  },

  // Health check settings
  healthCheck: {
    timeout: 5000,
    interval: 60000, // 1 minute
  },
}

export default REDIS_CONFIG
