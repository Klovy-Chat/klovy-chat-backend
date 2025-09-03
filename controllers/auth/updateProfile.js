import User from "../../model/UserModel.js";

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
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
      },
    );

    if (req.app.get("io")) {
      req.app.get("io").emit("profile-name-updated", {
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

export default updateProfile;
