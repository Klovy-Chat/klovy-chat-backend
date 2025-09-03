import { Router } from "express";
import {
  getUserInfo,
  login,
  signup,
  logout,
  updateProfile,
  addProfileImage,
  removeProfileImage,
  verifyEmail,
} from "../controllers/AuthController.js";
import verifyToken from "../middlewares/AuthMiddleware.js";
import { verifyTurnstileToken } from "../middlewares/TurnstileMiddleware.js";
import { loginLimiter } from "../utils/ratelimit/loginLimiter.js";
import { signupLimiter } from "../utils/ratelimit/signupLimiter.js";
import { emailVerificationLimiter } from "../utils/ratelimit/emailVerificationLimiter.js";
import {
  requireActiveAccount,
  logSuspiciousActivity,
} from "../middlewares/AuthMiddleware.js";
import multer from "multer";

const authRoutes = Router();
const upload = multer({
  dest: "uploads/profiles/",
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

authRoutes.post(
  "/signup",
  signupLimiter,
  verifyTurnstileToken,
  logSuspiciousActivity("signup"),
  signup,
);

authRoutes.post(
  "/login",
  loginLimiter,
  verifyTurnstileToken,
  logSuspiciousActivity("login"),
  login,
);

authRoutes.get(
  "/verify-email/:token",
  emailVerificationLimiter,
  logSuspiciousActivity("email-verification"),
  verifyEmail,
);

authRoutes.post("/logout", verifyToken, logout);

authRoutes.get("/userinfo", verifyToken, requireActiveAccount, getUserInfo);

authRoutes.post(
  "/update-profile",
  verifyToken,
  requireActiveAccount,
  logSuspiciousActivity("profile-update"),
  updateProfile,
);

authRoutes.post(
  "/add-profile-image",
  verifyToken,
  requireActiveAccount,
  upload.single("profile-image"),
  logSuspiciousActivity("profile-image-upload"),
  addProfileImage,
);

authRoutes.delete(
  "/remove-profile-image",
  verifyToken,
  requireActiveAccount,
  removeProfileImage,
);

export default authRoutes;
