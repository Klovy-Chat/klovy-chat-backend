import rateLimit from "express-rate-limit";

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many signup attempts. Try again in 1 hour.",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
