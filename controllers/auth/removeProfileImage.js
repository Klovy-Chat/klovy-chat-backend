import User from "../../model/UserModel.js";
import { unlinkSync } from "fs";
import path from "path";
import fs from "fs";

const removeProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.image) {
      const imagePath = path.join(process.cwd(), user.image);

      if (fs.existsSync(imagePath)) {
        unlinkSync(imagePath);
      }

      user.image = null;
      await user.save();
    }

    res.json({ message: "Profile image removed successfully" });
  } catch (err) {
    console.error("Error in removeProfileImage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default removeProfileImage;
