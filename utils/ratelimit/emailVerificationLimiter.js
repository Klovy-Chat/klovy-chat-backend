import rateLimit from "express-rate-limit";

export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many email verification attempts. Try again in 1 hour.",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
