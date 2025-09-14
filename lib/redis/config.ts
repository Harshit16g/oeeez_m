export const REDIS_CONFIG = {
  connection: {
    url: process.env.REDIS_URL,
    connectTimeout: Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT || "10000"),
    commandTimeout: Number.parseInt(process.env.REDIS_COMMAND_TIMEOUT || "5000"),
    retryDelayOnFailover: Number.parseInt(process.env.REDIS_RETRY_DELAY || "100"),
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false",
    maxRetriesPerRequest: Number.parseInt(process.env.REDIS_MAX_RETRIES || "3"),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === "true",
    keepAlive: Number.parseInt(process.env.REDIS_KEEP_ALIVE || "30000"),
    family: Number.parseInt(process.env.REDIS_FAMILY || "4"),
  },
  cache: {
    defaultTTL: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"),
    shortTTL: Number.parseInt(process.env.CACHE_TTL_SHORT || "300"),
    mediumTTL: Number.parseInt(process.env.CACHE_TTL_MEDIUM || "1800"),
    longTTL: Number.parseInt(process.env.CACHE_TTL_LONG || "7200"),
    prefix: process.env.REDIS_CACHE_PREFIX || "artistly:cache:",
  },
  session: {
    ttl: Number.parseInt(process.env.SESSION_TTL || "86400"),
    prefix: process.env.REDIS_SESSION_PREFIX || "artistly:session:",
  },
  rateLimit: {
    prefix: process.env.REDIS_RATE_LIMIT_PREFIX || "artistly:ratelimit:",
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX || "100"),
  },
  analytics: {
    prefix: process.env.REDIS_ANALYTICS_PREFIX || "artistly:analytics:",
    ttl: Number.parseInt(process.env.ANALYTICS_TTL || "86400"),
  },
  tags: {
    prefix: process.env.REDIS_TAG_PREFIX || "artistly:tags:",
  },
  performance: {
    maxCacheSize: Number.parseInt(process.env.MAX_CACHE_SIZE || "1000000"), // 1MB
    maxKeyLength: Number.parseInt(process.env.MAX_KEY_LENGTH || "250"),
    cleanupInterval: Number.parseInt(process.env.CLEANUP_INTERVAL || "3600000"), // 1 hour
    cleanupBatchSize: Number.parseInt(process.env.CLEANUP_BATCH_SIZE || "100"),
  },
}

export default REDIS_CONFIG
