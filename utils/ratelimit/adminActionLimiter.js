import rateLimit from "express-rate-limit";

export const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many admin actions. Slow down.",
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
