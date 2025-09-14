// Redis configuration with fallbacks for missing environment variables
export const REDIS_CONFIG = {
  connection: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || "default",
    db: Number.parseInt(process.env.REDIS_DB || "0"),
    connectTimeout: Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT || "10000"),
    commandTimeout: Number.parseInt(process.env.REDIS_COMMAND_TIMEOUT || "5000"),
    retryDelayOnFailover: Number.parseInt(process.env.REDIS_RETRY_DELAY || "100"),
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    maxRetriesPerRequest: Number.parseInt(process.env.REDIS_MAX_RETRIES || "3"),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === "true",
    keepAlive: Number.parseInt(process.env.REDIS_KEEP_ALIVE || "30000"),
    family: Number.parseInt(process.env.REDIS_FAMILY || "4"),
  },
  keyPrefixes: {
    cache: process.env.REDIS_CACHE_PREFIX || "artistly:cache:",
    session: process.env.REDIS_SESSION_PREFIX || "artistly:session:",
    rateLimit: process.env.REDIS_RATE_LIMIT_PREFIX || "artistly:rate_limit:",
    tag: process.env.REDIS_TAG_PREFIX || "artistly:tag:",
    analytics: process.env.REDIS_ANALYTICS_PREFIX || "artistly:analytics:",
  },
  ttl: {
    shortCache: Number.parseInt(process.env.CACHE_TTL_SHORT || "300"), // 5 minutes
    mediumCache: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"), // 30 minutes
    longCache: Number.parseInt(process.env.CACHE_TTL_LONG || "7200"), // 2 hours
    userProfile: Number.parseInt(process.env.USER_PROFILE_TTL || "3600"), // 1 hour
    artistData: Number.parseInt(process.env.ARTIST_DATA_TTL || "1800"), // 30 minutes
    session: Number.parseInt(process.env.SESSION_TTL || "86400"), // 24 hours
    analytics: Number.parseInt(process.env.ANALYTICS_TTL || "604800"), // 7 days
  },
  features: {
    enableCache: process.env.ENABLE_REDIS_CACHE === "true",
    enableRateLimit: process.env.ENABLE_RATE_LIMITING === "true",
    enableErrorLogging: process.env.ENABLE_ERROR_LOGGING === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
  },
  limits: {
    maxSessionsPerUser: Number.parseInt(process.env.MAX_SESSIONS_PER_USER || "5"),
    maxCacheSize: process.env.MAX_CACHE_SIZE || "100mb",
    maxKeyLength: Number.parseInt(process.env.MAX_KEY_LENGTH || "250"),
  },
  cleanup: {
    interval: Number.parseInt(process.env.CLEANUP_INTERVAL || "3600000"), // 1 hour
    batchSize: Number.parseInt(process.env.CLEANUP_BATCH_SIZE || "100"),
  },
} as const

export type RedisTTLType = keyof typeof REDIS_CONFIG.ttl
export type RedisFeatureType = keyof typeof REDIS_CONFIG.features
export type RedisPrefixType = keyof typeof REDIS_CONFIG.keyPrefixes
