import express from "express";
import { getUserStatus } from "../controllers/UserController.js";

const router = express.Router();

router.get("/status/:userId", getUserStatus);

export default router;
