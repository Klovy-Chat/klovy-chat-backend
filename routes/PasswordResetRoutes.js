import express from "express";
import passwordResetController from "../controllers/PasswordResetController.js";
import { passwordResetLimiter } from "../utils/ratelimit/passwordResetLimiter.js";
import { logSuspiciousActivity } from "../middlewares/AuthorizationMiddleware.js";

const router = express.Router();

router.post("/request-reset", 
  passwordResetLimiter,
  logSuspiciousActivity('password-reset-request'),
  passwordResetController.requestPasswordReset
);

router.post("/verify-token", 
  passwordResetLimiter,
  logSuspiciousActivity('password-reset-verify'),
  passwordResetController.verifyResetToken
);

router.post("/reset", 
  passwordResetLimiter,
  logSuspiciousActivity('password-reset-complete'),
  passwordResetController.resetPassword
);

export default router;
