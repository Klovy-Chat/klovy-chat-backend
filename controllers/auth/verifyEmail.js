import User from "../../model/UserModel.js";

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Brak tokenu weryfikacyjnego.",
    });
  }

  try {
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Nieprawidłowy lub wygasły token.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "E-mail został zweryfikowany pomyślnie. Możesz się teraz zalogować.",
    });
  } catch (err) {
    console.error("Error verifying email:", err);
    return res.status(500).json({
      success: false,
      message: "Błąd serwera podczas weryfikacji e-maila.",
    });
  }
};

export default verifyEmail;
