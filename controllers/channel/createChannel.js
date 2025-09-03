import mongoose from "mongoose";
import Channel from "../../model/ChannelModel.js";
import User from "../../model/UserModel.js";

const createChannel = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return response.status(400).json({ message: "Admin user not found." });
    }

    let validMembers = [];

    if (Array.isArray(members) && members.length > 0) {
      validMembers = await User.find({ _id: { $in: members } });

      if (validMembers.length !== members.length) {
        return response
          .status(400)
          .json({ message: "Some members are not valid users." });
      }
    }

    const newChannel = new Channel({
      name,
      members: validMembers.map((u) => u._id),
      admin: userId,
      messages: [],
    });

    await newChannel.save();

    return response.status(201).json({ channel: newChannel });
  } catch (error) {
    console.error("Error creating channel:", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export default createChannel;
