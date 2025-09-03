import User from "../../model/UserModel.js";
import bcrypt from "bcrypt";

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character" 
      });
    }

    const users = await User.find({
      resetPasswordToken: { $ne: null },
      resetPasswordExpires: { $gt: Date.now() },
    });

    let matchedUser = null;
    for (const user of users) {
      try {
        const isValid = await bcrypt.compare(token, user.resetPasswordToken);

        if (isValid) {
          matchedUser = user;
          break;
        }
      } catch (err) {
        console.error("Token comparison error");
      }
    }

    if (!matchedUser) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }

    if (!matchedUser) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }

    matchedUser.password = newPassword;
    matchedUser.resetPasswordToken = null;
    matchedUser.resetPasswordExpires = null;
    matchedUser.tokenVersion = (matchedUser.tokenVersion || 0) + 1;

    try {
      await matchedUser.save();

      const isPasswordValid = await matchedUser.comparePassword(newPassword);

      if (!isPasswordValid) {
        throw new Error("Password was not properly saved");
      }
    } catch (error) {
      console.error("Error saving new password:", error);
      throw error;
    }

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
