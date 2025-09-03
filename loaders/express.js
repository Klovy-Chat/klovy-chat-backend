import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import path from "path";
import dotenv from "dotenv";

import authRoutes from "../routes/AuthRoutes.js";
import contactsRoutes from "../routes/ContactRoutes.js";
import messagesRoutes from "../routes/MessagesRoute.js";
import channelRoutes from "../routes/ChannelRoutes.js";
import whitelistRoutes from "../routes/WhitelistRoutes.js";
import userRoutes from "../routes/UserRoutes.js";
import statusRoutes from "../routes/StatusRoutes.js";
import passwordResetRoutes from "../routes/PasswordResetRoutes.js";
import inviteRoutes from "../routes/InviteRoutes.js";

import { whitelistCheck } from "../middlewares/WhitelistMiddleware.js";
import { globalLimiter } from "../utils/ratelimit/globalLimiter.js";
import { sendLimiter } from "../utils/ratelimit/sendLimiter.js";
import { authRateLimiter } from "../utils/ratelimit/authRateLimiter.js";

import validateJsonPayload from "../utils/validators/validateJsonPayload.js";
import sanitizeInput from "../utils/validators/sanitizeInput.js";
import fileTypeValidator from "../utils/validators/fileTypeValidator.js";

dotenv.config({ path: ".env" });

export default function createApp(__dirname) {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.use(compression());
  app.use(mongoSanitize({ replaceWith: "_" }));
  app.use(xss());
  app.use(hpp({ whitelist: ["sort", "fields", "page", "limit"] }));
  app.use(globalLimiter);
  app.set("trust proxy", 1);

  const allowedOrigins = [process.env.ORIGIN || "http://localhost:5173"].filter(
    Boolean,
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Disposition"],
      maxAge: 86400,
    }),
  );

  app.use(cookieParser());
  app.use(
    express.json({
      limit: "10mb",
      type: ["application/json", "text/plain"],
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );
  app.use(validateJsonPayload);
  app.use(sanitizeInput);

  const setSecureStaticHeaders = (res, path, stat) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set(
      "Access-Control-Allow-Origin",
      process.env.ORIGIN || "http://localhost:5173",
    );
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "public, max-age=86400");
  };

  app.use(
    "/uploads/profiles",
    sendLimiter,
    fileTypeValidator(["image/jpeg", "image/png", "image/webp"]),
    express.static(path.join(__dirname, "uploads/profiles"), {
      setHeaders: setSecureStaticHeaders,
      maxAge: "1d",
      etag: true,
    }),
  );

  app.use(
    "/uploads/files",
    sendLimiter,
    express.static(path.join(__dirname, "uploads/files"), {
      setHeaders: setSecureStaticHeaders,
      maxAge: "1h",
      etag: true,
    }),
  );

  app.use(
    "/uploads/channels",
    sendLimiter,
    fileTypeValidator(["image/jpeg", "image/png", "image/webp"]),
    express.static(path.join(__dirname, "uploads/channels"), {
      setHeaders: setSecureStaticHeaders,
      maxAge: "1d",
      etag: true,
    }),
  );

  app.use("/api/auth", authRateLimiter, authRoutes);
  app.use("/api/password-reset", authRateLimiter, passwordResetRoutes);
  app.use("/whitelist", authRateLimiter, whitelistRoutes);
  app.use("/api", inviteRoutes);
  app.use("/api/contacts", whitelistCheck, contactsRoutes);
  app.use("/api/messages", sendLimiter, whitelistCheck, messagesRoutes);
  app.use("/api/channel", sendLimiter, whitelistCheck, channelRoutes);
  app.use("/api/user", whitelistCheck, userRoutes);
  app.use("/api/user/status", whitelistCheck, statusRoutes);

  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      method: req.method,
    });
  });

  app.use((err, req, res, next) => {
    console.error("Server error:", {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });
    if (process.env.NODE_ENV === "production") {
      if (err.status === 400) {
        res.status(400).json({ error: "Bad Request" });
      } else if (err.status === 401) {
        res.status(401).json({ error: "Unauthorized" });
      } else if (err.status === 403) {
        res.status(403).json({ error: "Forbidden" });
      } else if (err.status === 404) {
        res.status(404).json({ error: "Not Found" });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.status(err.status || 500).json({
        error: err.message,
        stack: err.stack,
      });
    }
  });

  return app;
}
