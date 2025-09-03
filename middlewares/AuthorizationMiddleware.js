export const requireAdmin = async (req, res, next) => {
  try {
    const User = (await import("../model/UserModel.js")).default;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Admin check error");
    return res.status(500).json({ error: "Authorization check failed" });
  }
};

export const requireOwnershipOrAdmin = (Model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const User = (await import("../model/UserModel.js")).default;
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
      console.error("Ownership check error");
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

export const requireActiveAccount = async (req, res, next) => {
  try {
    const User = (await import("../model/UserModel.js")).default;
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
    console.error("Account status check error");
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
