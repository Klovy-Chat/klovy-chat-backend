import mongoose from "mongoose";
import Channel from "../../model/ChannelModel.js";

const getUserChannels = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .populate("admin", "firstName lastName email _id image color")
      .populate("members", "firstName lastName email _id image color")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Error getting user channels:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default getUserChannels;
