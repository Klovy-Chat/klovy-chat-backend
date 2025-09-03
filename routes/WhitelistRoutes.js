import { Router } from "express";
import { approveUser } from "../controllers/WhitelistController.js";
import verifyToken from "../middlewares/AuthMiddleware.js";

const whitelistRoutes = Router();

whitelistRoutes.post("/approve-user", verifyToken, approveUser);

export default whitelistRoutes;
