import rateLimit from "express-rate-limit";

export const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: {
    error: "Too many messages sent, please slow down.",
    retryAfter: 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
