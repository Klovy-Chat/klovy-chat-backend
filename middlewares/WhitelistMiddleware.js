import User from "../model/UserModel.js";

export const whitelistCheck = async (req, res, next) => {
  if (process.env.WHITELIST_ENABLED !== "true") {
    return next();
  }
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const user = await User.findById(userId);

    if (!user || !user.isWhitelisted) {
      return res.status(403).json({ message: "User not whitelisted." });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Whitelist check error." });
  }
};
