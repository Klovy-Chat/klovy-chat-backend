import User from "../../model/UserModel.js";
import bcrypt from "bcrypt";

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: { $ne: null },
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    return res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ message: "Error verifying token" });
  }
};
