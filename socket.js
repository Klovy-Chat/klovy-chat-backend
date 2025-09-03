import { Server as SocketIOServer } from "socket.io";

import sendMessage from "./socket/handlers/sendMessage.js";
import sendChannelMessage from "./socket/handlers/sendChannelMessage.js";
import handleTyping from "./socket/handlers/handleTyping.js";
import handleReaction from "./socket/handlers/handleReaction.js";
import markMessageAsRead from "./socket/handlers/markMessageAsRead.js";
import handleEditMessage from "./socket/handlers/handleEditMessage.js";
import handleDeleteMessage from "./socket/handlers/handleDeleteMessage.js";
import notifyChannelDeleted from "./socket/handlers/notifyChannelDeleted.js";
import addChannelNotify from "./socket/handlers/addChannelNotify.js";

import { setUserOnline, setUserOffline } from "./socket/utils/userStatus.js";
import disconnect from "./socket/utils/disconnect.js";
import {
  broadcastUserStatus,
  broadcastProfileUpdate,
} from "./socket/utils/broadcast.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();
  const typingUsers = new Map();

  io.on("connection", (socket) => {
    try {
      const userId = socket.handshake.query.userId;
      if (userId) {
        userSocketMap.set(userId, socket.id);
        setUserOnline(userId);
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      } else {
        console.log("User ID not provided during connection.");
      }

      socket.on("add-channel-notify", (channel) =>
        addChannelNotify(channel, userSocketMap, io),
      );
      socket.on("sendMessage", (message) =>
        sendMessage(message, userSocketMap, io),
      );
      socket.on("send-channel-message", (message) =>
        sendChannelMessage(message, userSocketMap, io),
      );
      socket.on("typing", (data) =>
        handleTyping(data, typingUsers, userSocketMap, io),
      );
      socket.on("message-reaction", (data) =>
        handleReaction(data, userSocketMap, io),
      );
      socket.on("mark-message-read", (data) =>
        markMessageAsRead(data, userSocketMap, io),
      );

      socket.on("set-online", async (data) => {
        if (data.userId) {
          await setUserOnline(data.userId);
          broadcastUserStatus(
            data.userId,
            { isOnline: true, lastSeen: null },
            userSocketMap,
            io,
          );
        }
      });

      socket.on("set-offline", async (data) => {
        if (data.userId) {
          await setUserOffline(data.userId);
          broadcastUserStatus(
            data.userId,
            { isOnline: false, lastSeen: Date.now() },
            userSocketMap,
            io,
          );
        }
      });

      socket.on("editMessage", (data) =>
        handleEditMessage(data, userSocketMap, io),
      );

      socket.on("deleteMessage", (data) =>
        handleDeleteMessage(data, userSocketMap, io),
      );

      socket.on("profile-image-updated", (data) => {
        broadcastProfileUpdate(
          data.userId,
          "contact-avatar-updated",
          { image: data.image },
          userSocketMap,
          io,
        );
      });

      socket.on("profile-name-updated", (data) => {
        broadcastProfileUpdate(
          data.userId,
          "contact-name-updated",
          {
            firstName: data.firstName,
            lastName: data.lastName,
          },
          userSocketMap,
          io,
        );
      });

      socket.on("disconnect", async () => {
        disconnect(socket, userSocketMap);
        if (userId && typeof userId === "string" && userId.trim() !== "") {
          await setUserOffline(userId);
        } else {
          console.warn(
            "Disconnect: userId is undefined or invalid, skipping setUserOffline.",
          );
        }
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
    }
  });

  io.notifyChannelDeleted = (channel) =>
    notifyChannelDeleted(channel, userSocketMap, io);

  return io;
};

export default setupSocket;
