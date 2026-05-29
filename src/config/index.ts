export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  jwt: {
    accessSecret:
      process.env.ACCESS_TOKEN_SECRET ||
      'fallback-access-secret-change-in-production',
    refreshSecret:
      process.env.REFRESH_TOKEN_SECRET ||
      'fallback-refresh-secret-change-in-production',
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  cache: {
    taskListTtl: 300, // 5 minutes in seconds
  },
} as const;
