import Channel from "../../model/ChannelModel.js";

const addUserToChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userIdToAdd } = req.body;

    const userId = req.userId;
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can add users" });
    }

    if (channel.members.map((m) => m.toString()).includes(userIdToAdd)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    channel.members.push(userIdToAdd);

    await channel.save();

    if (req.app && req.app.get && req.app.get("io")) {
      const io = req.app.get("io");
      io.to(userIdToAdd).emit("channel-added", { channelId });
    }

    return res.status(200).json({ message: "User added to channel" });
  } catch (error) {
    console.error("Error adding user to channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default addUserToChannel;
