import Channel from "../../model/ChannelModel.js";
import path from "path";

const uploadChannelAvatar = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only admin can change channel avatar" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (channel.image) {
      const oldPath = path.join(process.cwd(), channel.image);
      try {
        require("fs").unlinkSync(oldPath);
      } catch {}
    }

    const imagePath = path
      .join("uploads", "channels", req.file.filename)
      .replace(/\\\\/g, "/")
      .replace(/\\/g, "/");

    channel.image = imagePath;

    await channel.save();

    if (req.app && req.app.get && req.app.get("io")) {
      const io = req.app.get("io");

      [channel.admin, ...channel.members].forEach((memberId) => {
        io.to(memberId.toString()).emit("channel-avatar-updated", {
          channelId,
          image: imagePath,
        });
      });
    }
    
    return res
      .status(200)
      .json({ message: "Avatar updated", image: imagePath });
  } catch (error) {
    console.error("Error uploading channel avatar:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default uploadChannelAvatar;
