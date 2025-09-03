import Channel from "../../model/ChannelModel.js";

const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can delete channel" });
    }

    await Channel.findByIdAndDelete(channelId);

    if (req.app && req.app.get && req.app.get("io")) {
      const io = req.app.get("io");

      channel.members.forEach((memberId) => {
        io.to(memberId.toString()).emit("channel-deleted", { channelId });
      });

      io.to(channel.admin.toString()).emit("channel-deleted", { channelId });
    }

    return res.status(200).json({ message: "Channel deleted" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default deleteChannel;
