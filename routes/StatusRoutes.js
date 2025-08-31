import { Router } from "express";
import { updateUserStatus } from "../controllers/StatusController.js";
import verifyToken from "../middlewares/AuthMiddleware.js";

const statusRoutes = Router();

statusRoutes.post("/update", verifyToken, updateUserStatus);

export default statusRoutes;
