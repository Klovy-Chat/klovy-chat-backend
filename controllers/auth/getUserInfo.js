import User from "../../model/UserModel.js";

const getUserInfo = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).send("User not authenticated.");
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

export default getUserInfo;
