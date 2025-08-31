import jwt from "jsonwebtoken";
import User from "../model/UserModel.js";

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);

    if (!payload?.userId) {
      return res.status(403).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(payload.userId);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res
        .status(403)
        .json({ message: "Token is invalid (version mismatch)." });
    }

    req.userId = user._id.toString();
    req.user = { id: user._id.toString() };

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
