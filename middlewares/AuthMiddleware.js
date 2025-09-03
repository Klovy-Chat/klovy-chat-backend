import jwt from "jsonwebtoken";
import User from "../model/UserModel.js";

export const verifyToken = async (req, res, next) => {
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

    const user = await User.findById(payload.userId).select('+tokenVersion');

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
      isWhitelisted: user.isWhitelisted 
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

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Authorization check failed" });
  }
};

export const requireOwnershipOrAdmin = (Model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.isAdmin || user.role === 'admin') {
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
      if (resource.userId?.toString() !== userId && 
          resource.sender?.toString() !== userId &&
          resource.createdBy?.toString() !== userId &&
          resource._id?.toString() !== userId) {
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
    
    if (!user.isEmailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
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
      /<script/i,
      /union.*select/i,
      /javascript:/i,
      /on\w+\s*=/i,
    ];
    
    const requestData = JSON.stringify({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(requestData)
    );
    
    if (isSuspicious) {
      console.warn(`Suspicious activity detected: ${action}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.userId,
        timestamp: new Date().toISOString(),
        data: requestData
      });
    }
    
    next();
  };
};
