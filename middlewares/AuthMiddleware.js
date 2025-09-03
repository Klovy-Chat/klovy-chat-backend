import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ message: "Authentication token missing." });
  }

  if (token.length > 1000) {
    return res.status(401).json({ message: "Invalid token format." });
  }

  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err || !payload?.userId) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    try {
      const User = (await import("../model/UserModel.js")).default;
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
    } catch (e) {
      console.error("Auth middleware error");
      return res.status(500).json({ message: "Token validation error." });
    }
  });
};

export default verifyToken;
