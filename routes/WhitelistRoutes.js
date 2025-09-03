import { Router } from "express";
import { approveUser } from "../controllers/WhitelistController.js";
import verifyToken from "../middlewares/AuthMiddleware.js";
import { 
  requireAdmin, 
  requireActiveAccount,
  logSuspiciousActivity 
} from "../middlewares/AuthorizationMiddleware.js";
import { adminActionLimiter } from "../utils/ratelimit/adminActionLimiter.js";

const whitelistRoutes = Router();

whitelistRoutes.post("/approve-user", 
  adminActionLimiter,
  verifyToken, 
  requireActiveAccount,
  requireAdmin,
  logSuspiciousActivity('whitelist-approval'),
  approveUser
);

export default whitelistRoutes;
