import Channel from "../../model/ChannelModel.js";

const renameChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (
      !name ||
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 50
    ) {
      return res
        .status(400)
        .json({ error: "Nazwa kanału musi mieć od 3 do 50 znaków" });
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ error: "Kanał nie istnieje" });
    }

    if (channel.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Tylko administrator może zmienić nazwę kanału" });
    }

    channel.name = name.trim();

    await channel.save();

    if (req.app && req.app.get && req.app.get("io")) {
      req.app
        .get("io")
        .to(channel._id.toString())
        .emit("channel-name-updated", {
          channelId: channel._id.toString(),
          name: channel.name,
        });
    }

    return res.status(200).json({ name: channel.name });
  } catch (error) {
    console.error("Error renaming channel:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default renameChannel;
