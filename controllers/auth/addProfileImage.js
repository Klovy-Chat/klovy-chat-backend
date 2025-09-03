import User from "../../model/UserModel.js";
import { renameSync } from "fs";

const addProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).send("File is required.");
    }

    const allowedExt = ["jpg", "jpeg", "png", "webp"];
    const ext = req.file.originalname.split(".").pop().toLowerCase();

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
      },
    );

    if (req.app.get("io")) {
      req.app.get("io").emit("profile-image-updated", {
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

export default addProfileImage;
