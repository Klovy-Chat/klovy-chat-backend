import User from "../model/UserModel.js";

export const updateUserStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { customStatus } = req.body;

    if (!customStatus)
      return res.status(400).json({ error: "Status required" });

    await User.findByIdAndUpdate(userId, { customStatus });

    if (req.app.get("io")) {
      req.app.get("io").emit("user-status-updated", { userId, customStatus });
    }

    res.json({ success: true, customStatus });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
