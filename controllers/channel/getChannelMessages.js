import Channel from "../../model/ChannelModel.js";
import Message from "../../model/MessagesModel.js";

const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findOne({
      _id: channelId,
      $or: [{ admin: userId }, { members: userId }],
    });

    if (!channel) {
      return res
        .status(404)
        .json({ message: "Channel not found or access denied" });
    }

    const messages = await Message.find({
      $and: [{ _id: { $in: channel.messages } }, { deleted: { $ne: true } }],
    })
      .populate("sender", "firstName lastName email _id image color")
      .sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting channel messages:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export default getChannelMessages;
