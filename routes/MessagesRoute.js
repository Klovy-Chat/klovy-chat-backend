import { Router } from "express";
import {
  getMessages,
  uploadFile,
  editMessage,
} from "../controllers/MessagesController.js";
import verifyToken, {
  requireActiveAccount,
  requireOwnershipOrAdmin,
  logSuspiciousActivity,
} from "../middlewares/AuthMiddleware.js";
import multer from "multer";
import Message from "../model/MessagesModel.js";

const messagesRoutes = Router();
const upload = multer({
  dest: "uploads/files/",
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

messagesRoutes.post(
  "/get-messages",
  verifyToken,
  requireActiveAccount,
  logSuspiciousActivity("get-messages"),
  getMessages,
);

messagesRoutes.post(
  "/upload-file",
  verifyToken,
  requireActiveAccount,
  upload.single("file"),
  logSuspiciousActivity("file-upload"),
  uploadFile,
);

messagesRoutes.put(
  "/:messageId",
  verifyToken,
  requireActiveAccount,
  requireOwnershipOrAdmin(Message, "messageId"),
  logSuspiciousActivity("edit-message"),
  editMessage,
);

messagesRoutes.delete("/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    await Message.findByIdAndUpdate(messageId, {
      deleted: true,
      deletedAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default messagesRoutes;
