import Channel from "../../model/ChannelModel.js";

const leaveChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.admin.toString() === userId) {
      return res
        .status(403)
        .json({ message: "Admin cannot leave channel. Delete instead." });
    }

    channel.members = channel.members.filter((m) => m.toString() !== userId);

    await channel.save();

    if (req.app && req.app.get && req.app.get("io")) {
      const io = req.app.get("io");
      io.to(userId).emit("channel-left", { channelId });
    }

    return res.status(200).json({ message: "Left channel" });
  } catch (error) {
    console.error("Error leaving channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default leaveChannel;
