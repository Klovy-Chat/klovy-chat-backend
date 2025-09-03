import { sendResetPasswordEmail } from "../../utils/emailService.js";
import crypto from "crypto";
import User from "../../model/UserModel.js";
import bcrypt from "bcrypt";

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();
    await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res
      .status(500)
      .json({ message: "Error processing password reset request" });
  }
};
