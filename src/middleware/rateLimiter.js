import rateLimit from 'express-rate-limit';

const rateLimitResponse = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(res.getHeader('Retry-After') || 60),
    },
  });
};

//Global rate limiter — 200 requests per minute per IP.
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'],
});

//10 attempts per 15 minutes per IP.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'],
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

//Location ping limiter — allows up to 120 pings per minute per IP.
export const locationPingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  keyGenerator: (req) => req.user?.id || req.ip,
});
