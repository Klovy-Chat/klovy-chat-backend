import jwt from "jsonwebtoken";
import User from "../model/UserModel.js";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/emailService.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return User.findById(userId).then(user => {
    const tokenVersion = user?.tokenVersion || 0;
    return jwt.sign({ email, userId, tokenVersion }, process.env.JWT_KEY, {
      expiresIn: maxAge,
    });
  });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params; 
  if (!token) {
    return res.status(400).json({ 
      success: false,
      message: "Brak tokenu weryfikacyjnego." 
    });
  }
  
  try {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Nieprawidłowy lub wygasły token." 
      });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "E-mail został zweryfikowany pomyślnie. Możesz się teraz zalogować."
    });
    
  } catch (err) {
    console.error("Error verifying email:", err);
    return res.status(500).json({ 
      success: false,
      message: "Błąd serwera podczas weryfikacji e-maila." 
    });
  }
};

export const signup = async (req, res) => {
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
      isEmailVerified: false
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

export const login = async (req, res) => {
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
      return res.status(403).json({ message: "Musisz zweryfikować e-mail, zanim się zalogujesz." });
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

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(404).send("User id not found.");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User with the given id not found.");
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      profileSetup: user.profileSetup,
      color: user.color,
      isWhitelisted: user.isWhitelisted,
      isWhitelistEnabled: process.env.WHITELIST_ENABLED === "true",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict", 
      maxAge: 1, 
    });
    return res.status(200).send("Logout successful");
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required.");
    }

    if (!firstName) {
      return res.status(400).send("Firstname is required.");
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName: lastName || null,
          color,
          profileSetup: true,
        },
        {
          new: true,
          runValidators: true,
        }
    );

    if (req.app.get('io')) {
      req.app.get('io').emit("profile-name-updated", {
        userId: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      });
    }

    return res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      image: updatedUser.image,
      profileSetup: updatedUser.profileSetup,
      color: updatedUser.color,
    });
  } catch (err) {
    return res.status(500).send("Internal Server Error.");
  }
};

export const addProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).send("File is required.");
    }

    const allowedExt = ["jpg", "jpeg", "png", "webp"];
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      return res.status(400).send("Invalid file type.");
    }

    const timestamp = Date.now();
    const fileName = `uploads/profiles/${req.userId}-${timestamp}.${ext}`;

    renameSync(req.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { image: fileName },
        {
          new: true,
          runValidators: true,
        }
    );
    
    if (req.app.get('io')) {
      req.app.get('io').emit("profile-image-updated", {
        userId: req.userId,
        image: updatedUser.image,
      });
    }

    return res.status(200).json({ image: updatedUser.image });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error.");
  }
};

export const removeProfileImage = async (req, res) => {
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