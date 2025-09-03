import User from "../../model/UserModel.js";
import { compare } from "bcrypt";
import { createToken, maxAge } from "../../utils/auth/tokenUtils.js";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and Password Required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (!user.isWhitelisted && !user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Musisz zweryfikować e-mail, zanim się zalogujesz." });
    }

    const auth = await compare(password, user.password);

    if (!auth) {
      return res.status(400).send("Invalid Password");
    }

    const jwtToken = await createToken(email, user.id);

    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge,
    });

    return res.status(200).json({
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
    return res.status(500).send("Internal Server Error");
  }
};

export default login;
