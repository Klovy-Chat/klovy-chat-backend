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
    maxHttpBufferSize: 1e6,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    allowEIO3: false,
  });

  const userSocketMap = new Map();
  const typingUsers = new Map();
  const userRateLimits = new Map();

  const checkRateLimit = (
    userId,
    action,
    maxRequests = 30,
    windowMs = 60000,
  ) => {
    const now = Date.now();
    const userLimits = userRateLimits.get(userId) || {};
    const actionLimits = userLimits[action] || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > actionLimits.resetTime) {
      actionLimits.count = 0;
      actionLimits.resetTime = now + windowMs;
    }

    if (actionLimits.count >= maxRequests) {
      return false;
    }

    actionLimits.count++;
    userLimits[action] = actionLimits;
    userRateLimits.set(userId, userLimits);
    return true;
  };

  io.on("connection", (socket) => {
    try {
      const userId = socket.handshake.query.userId;
      const userAgent = socket.handshake.headers["user-agent"];
      const ip = socket.handshake.address;

      if (!userId || typeof userId !== "string" || userId.length > 50) {
        console.warn(`Invalid userId provided: ${userId} from IP: ${ip}`);
        socket.disconnect(true);
        return;
      }

      const existingConnections = Array.from(userSocketMap.entries()).filter(
        ([uid, socketId]) => uid === userId,
      ).length;

      if (existingConnections > 3) {
        console.warn(`Too many connections for user: ${userId}`);
        socket.disconnect(true);
        return;
      }

      userSocketMap.set(userId, socket.id);
      setUserOnline(userId);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

      const withRateLimit = (eventName, handler, maxReq = 30) => {
        return (...args) => {
          if (!checkRateLimit(userId, eventName, maxReq)) {
            console.warn(
              `Rate limit exceeded for user ${userId} on event ${eventName}`,
            );
            socket.emit("error", { message: "Rate limit exceeded" });
            return;
          }
          handler(...args);
        };
      };

      socket.on(
        "add-channel-notify",
        withRateLimit(
          "add-channel-notify",
          (channel) => addChannelNotify(channel, userSocketMap, io),
          10,
        ),
      );

      socket.on(
        "sendMessage",
        withRateLimit(
          "sendMessage",
          (message) => sendMessage(message, userSocketMap, io),
          30,
        ),
      );

      socket.on(
        "send-channel-message",
        withRateLimit(
          "send-channel-message",
          (message) => sendChannelMessage(message, userSocketMap, io),
          30,
        ),
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
