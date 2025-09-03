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
import multer from "multer";

const authRoutes = Router();
const upload = multer({ dest: "uploads/profiles/" });

authRoutes.post("/signup", verifyTurnstileToken, signup);

authRoutes.post("/login", verifyTurnstileToken, login);

authRoutes.post("/logout", logout);

authRoutes.get("/userinfo", verifyToken, getUserInfo);

authRoutes.post("/update-profile", verifyToken, updateProfile);

authRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"),
  addProfileImage,
);
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);

authRoutes.get("/verify-email/:token", verifyEmail);

export default authRoutes;
