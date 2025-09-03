import jwt from "jsonwebtoken";
import User from "../model/UserModel.js";

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    if (token.length > 1000) {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);

    if (!payload?.userId) {
      return res.status(403).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(payload.userId).select("+tokenVersion");

    if (!user) {
      return res.status(403).json({ message: "User not found." });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res
        .status(403)
        .json({ message: "Token is invalid (version mismatch)." });
    }

    if (user.isBlocked || !user.isActive) {
      return res.status(403).json({ message: "Account is inactive." });
    }

    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      email: user.email,
      isWhitelisted: user.isWhitelisted,
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token." });
    }

    return res.status(500).json({ message: "Token validation error." });
  }
};

export default verifyToken;

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isAdmin && user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Authorization check failed" });
  }
};

export const requireOwnershipOrAdmin = (Model, idParam = "id") => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.isAdmin || user.role === "admin") {
        return next();
      }

      const resourceId = req.params[idParam] || req.body[idParam];
      if (!resourceId) {
        return res.status(400).json({ error: "Resource ID required" });
      }

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      const userId = req.userId.toString();
      if (
        resource.userId?.toString() !== userId &&
        resource.sender?.toString() !== userId &&
        resource.createdBy?.toString() !== userId &&
        resource._id?.toString() !== userId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

export const requireActiveAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isBlocked || user.isBanned || !user.isActive) {
      return res.status(403).json({ error: "Account is inactive or blocked" });
    }

    if (
      !user.isEmailVerified &&
      process.env.REQUIRE_EMAIL_VERIFICATION === "true"
    ) {
      return res.status(403).json({ error: "Email verification required" });
    }

    next();
  } catch (error) {
    console.error("Account status check error:", error);
    return res.status(500).json({ error: "Account check failed" });
  }
};

export const logSuspiciousActivity = (action) => {
  return (req, res, next) => {
    const suspiciousPatterns = [
      /\.\./,
      /\.\.\\|\.\.\/|\\\.\.\/|\/\.\.\\/,
      /\%2e\%2e/i,
      /\%252e\%252e/i,

      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /on\w+\s*=/i,
      /style\s*=.*expression/i,
      /@import/i,

      /union.*select/i,
      /insert.*into/i,
      /update.*set/i,
      /delete.*from/i,
      /drop.*table/i,
      /create.*table/i,
      /alter.*table/i,
      /exec.*\(/i,
      /execute.*\(/i,
      /sp_/i,
      /xp_/i,
      /--/,
      /\/\*.*\*\//,
      /;.*select/i,
      /;\s*drop/i,
      /'\s*or\s*'1'\s*=\s*'1/i,
      /"\s*or\s*"1"\s*=\s*"1/i,
      /'\s*or\s*1\s*=\s*1/i,
      /"\s*or\s*1\s*=\s*1/i,

      /\||\&\&|\;/,
      /\$\(.*\)/,
      /`.*`/,
      /system\(/i,
      /exec\(/i,
      /eval\(/i,
      /passthru\(/i,
      /shell_exec\(/i,
      /cmd\.exe/i,
      /powershell/i,
      /bash/i,
      /\/bin\//i,

      /\(\|\(/,
      /\)\|\)/,
      /\*\)\(/,

      /<!ENTITY/i,
      /<!DOCTYPE.*ENTITY/i,
      /SYSTEM.*file:/i,

      /\{\{.*\}\}/,
      /\$\{.*\}/,
      /<\%.*\%>/,

      /\$where/i,
      /\$ne/i,
      /\$gt/i,
      /\$lt/i,
      /\$regex/i,
      /\$or/i,
      /\$and/i,

      /php:\/\//i,
      /file:\/\//i,
      /data:\/\//i,
      /expect:\/\//i,
      /\.php\?/i,
      /\.asp\?/i,
      /\.jsp\?/i,

      /\r\n|\n\r|\r|\n/,
      /content-type:/i,
      /set-cookie:/i,

      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /burp/i,
      /zap/i,
      /masscan/i,
      /dirb/i,
      /gobuster/i,

      /\%27|\%22|\%3c|\%3e|\%28|\%29/i,
      /\%3d|\%7c|\%26|\%3b/i,
      /\&\#x/i,
      /\&\#\d+/,

      /__proto__/i,
      /constructor.*prototype/i,

      /eyJ[A-Za-z0-9+\/=]+\./,
      /none.*algorithm/i,
    ];

    const suspiciousHeaders = [
      "x-forwarded-for",
      "x-real-ip",
      "x-originating-ip",
      "x-remote-ip",
      "x-cluster-client-ip",
    ];

    const requestData = JSON.stringify({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });

    let isSuspicious = suspiciousPatterns.some((pattern) =>
      pattern.test(requestData),
    );

    if (!isSuspicious) {
      const suspiciousHeaderCount = suspiciousHeaders.filter(
        (header) => req.headers[header],
      ).length;

      if (suspiciousHeaderCount > 2) {
        isSuspicious = true;
      }
    }

    if (!isSuspicious) {
      const totalParams =
        Object.keys(req.query).length +
        Object.keys(req.params).length +
        Object.keys(req.body || {}).length;

      if (totalParams > 50) {
        isSuspicious = true;
      }
    }

    if (!isSuspicious) {
      const hasLongValues = [
        ...Object.values(req.query),
        ...Object.values(req.params),
        ...Object.values(req.body || {}),
      ].some((value) => typeof value === "string" && value.length > 10000);

      if (hasLongValues) {
        isSuspicious = true;
      }
    }

    if (!isSuspicious && req.files) {
      const dangerousExtensions =
        /\.(php|asp|aspx|jsp|exe|bat|cmd|sh|ps1|py|rb|pl)$/i;
      const hasUnsafeFile = Object.values(req.files).some((file) =>
        Array.isArray(file)
          ? file.some((f) => dangerousExtensions.test(f.name))
          : dangerousExtensions.test(file.name),
      );

      if (hasUnsafeFile) {
        isSuspicious = true;
      }
    }

    if (isSuspicious) {
      console.warn(`Suspicious activity detected: ${action}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        userId: req.userId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        referer: req.get("Referer"),
        contentType: req.get("Content-Type"),
        contentLength: req.get("Content-Length"),
        data: requestData,
        suspiciousHeaders: suspiciousHeaders.filter(
          (header) => req.headers[header],
        ),
      });

      return res.status(400).json({
        message: "Suspicious activity detected",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        userId: req.userId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        referer: req.get("Referer"),
        contentType: req.get("Content-Type"),
        contentLength: req.get("Content-Length"),
        data: requestData,
        suspiciousHeaders: suspiciousHeaders.filter(
          (header) => req.headers[header],
        ),
      });
    }

    next();
  };
};
