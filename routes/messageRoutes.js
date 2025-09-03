import express from "express";
import {
  fetchAllMessages,
  addReaction,
  quoteMessage,
  editMessage,
  deleteMessage,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post("/fetch", protect, fetchAllMessages);

router.post("/reaction", protect, addReaction);

router.post("/quote", protect, quoteMessage);

router.put("/:messageId", protect, editMessage);

router.delete("/:messageId", protect, deleteMessage);

export default router;
