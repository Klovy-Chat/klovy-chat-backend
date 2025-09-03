import mongoose from "mongoose";
import validator from "validator";

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    
    if (!id) {
      return res.status(400).json({ error: `${paramName} is required` });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    
    next();
  };
};

export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

export const validatePassword = (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordToValidate = password || newPassword;
  
  if (!passwordToValidate) {
    return res.status(400).json({ error: "Password is required" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(passwordToValidate)) {
    return res.status(400).json({ 
      error: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character" 
    });
  }
  
  next();
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key].trim());

        if (req.body[key].length > 10000) {
          return res.status(400).json({ error: `${key} is too long` });
        }
      }
    }
  }
  next();
};

export const validateOwnership = (Model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.userId || req.user?.id;
      
      if (!resourceId || !userId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      if (resource.userId?.toString() !== userId.toString() && 
          resource.sender?.toString() !== userId.toString() &&
          resource.createdBy?.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Ownership validation error");
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
