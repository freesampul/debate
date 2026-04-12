import rateLimit from 'express-rate-limit'

/** 100 req / min per IP — applied to all routes */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

/** 10 req / 15 min per IP — auth endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
})

/** 5 rooms / hour per IP (proxy for per-user until JWT is decoded) */
export const roomCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Room creation limit reached, please try again later' },
})

/** 10 req / min per IP — voting */
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Voting rate limit reached, please slow down' },
})

/** 30 req / min per IP — chat send/report actions */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit reached, please slow down' },
})

/** 5 req / min per IP — LiveKit token generation */
export const livekitTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Token request limit reached, please try again later' },
})
