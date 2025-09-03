import { Router } from "express";
import { approveUser } from "../controllers/WhitelistController.js";
import verifyToken, {
  requireAdmin,
  requireActiveAccount,
  logSuspiciousActivity,
} from "../middlewares/AuthMiddleware.js";
import { adminActionLimiter } from "../utils/ratelimit/adminActionLimiter.js";

const whitelistRoutes = Router();

whitelistRoutes.post(
  "/approve-user",
  adminActionLimiter,
  verifyToken,
  requireActiveAccount,
  requireAdmin,
  logSuspiciousActivity("whitelist-approval"),
  approveUser,
);

export default whitelistRoutes;
