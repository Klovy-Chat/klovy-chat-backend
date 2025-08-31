import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ message: "Authentication token missing." });
  }

  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err || !payload?.userId) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    try {
      const User = (await import("../model/UserModel.js")).default;
      const user = await User.findById(payload.userId);

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        return res
          .status(403)
          .json({ message: "Token is invalid (version mismatch)." });
      }

      req.userId = payload.userId;
      req.user = { id: payload.userId };
      next();
    } catch (e) {
      console.error("Auth middleware error:", e);
      return res.status(500).json({ message: "Token validation error." });
    }
  });
};

export default verifyToken;
