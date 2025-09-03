import User from "../../model/UserModel.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/emailService.js";

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and Password Required");
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      email,
      password,
      emailVerificationToken,
      isEmailVerified: false,
    });

    if (!user.isWhitelisted) {
      try {
        await sendVerificationEmail(user.email, emailVerificationToken);
      } catch (e) {
        console.error("Błąd wysyłki e-maila weryfikacyjnego:", e);
      }
    }

    return res.status(201).json({
      message: !user.isWhitelisted
        ? "Account created. Please verify your email."
        : "Account created.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        profileSetup: user.profileSetup,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export default signup;
