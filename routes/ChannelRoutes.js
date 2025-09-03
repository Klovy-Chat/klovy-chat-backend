import { Router } from "express";
import uploadChannelAvatarMiddleware from "../middlewares/uploadChannelAvatar.js";
import verifyToken from "../middlewares/AuthMiddleware.js";
import {
  createChannel,
  getChannelMessages,
  getUserChannels,
  deleteChannel,
  leaveChannel,
  addUserToChannel,
  uploadChannelAvatar,
  deleteChannelAvatar,
  renameChannel,
} from "../controllers/ChannelControllers.js";

const channelRoutes = Router();

channelRoutes.patch("/:channelId/name", verifyToken, renameChannel);

channelRoutes.delete("/:channelId/avatar", verifyToken, deleteChannelAvatar);

channelRoutes.post(
  "/:channelId/avatar",
  verifyToken,
  uploadChannelAvatarMiddleware.single("avatar"),
  uploadChannelAvatar,
);

channelRoutes.post("/create-channel", verifyToken, createChannel);

channelRoutes.get("/get-user-channels", verifyToken, getUserChannels);

channelRoutes.get(
  "/get-channel-messages/:channelId",
  verifyToken,
  getChannelMessages,
);

channelRoutes.post("/leave/:channelId", verifyToken, leaveChannel);

channelRoutes.post("/add-user/:channelId", verifyToken, addUserToChannel);

channelRoutes.delete("/delete/:channelId", verifyToken, deleteChannel);

export default channelRoutes;
