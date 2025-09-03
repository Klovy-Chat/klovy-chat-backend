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

export default verifyToken;
