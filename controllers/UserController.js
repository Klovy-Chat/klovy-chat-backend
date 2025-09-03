import User from "../model/UserModel.js";

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "isOnline lastSeen image color customStatus",
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      image: user.image,
      color: user.color,
      customStatus: user.customStatus,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
