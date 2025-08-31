export const renameChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name } = req.body;
    const userId = req.userId;
    if (!name || typeof name !== "string" || name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({ error: "Nazwa kanału musi mieć od 3 do 50 znaków" });
    }
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Kanał nie istnieje" });
    }
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ error: "Tylko administrator może zmienić nazwę kanału" });
    }
    channel.name = name.trim();
    await channel.save();
    if (req.app && req.app.get && req.app.get('io')) {
      req.app.get('io').to(channel._id.toString()).emit('channel-name-updated', {
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
export const deleteChannelAvatar = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can delete channel avatar" });
    }
    if (channel.image) {
      const oldPath = path.join(process.cwd(), channel.image);
      try { require("fs").unlinkSync(oldPath); } catch {}
      channel.image = "";
      await channel.save();
      if (req.app && req.app.get && req.app.get('io')) {
        const io = req.app.get('io');
        [channel.admin, ...channel.members].forEach(memberId => {
          io.to(memberId.toString()).emit('channel-avatar-updated', { channelId, image: "" });
        });
      }
    }
    return res.status(200).json({ message: "Channel avatar deleted" });
  } catch (error) {
    console.error("Error deleting channel avatar:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
import path from "path";
export const uploadChannelAvatar = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can change channel avatar" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (channel.image) {
      const oldPath = path.join(process.cwd(), channel.image);
      try { require("fs").unlinkSync(oldPath); } catch {}
    }
    const imagePath = path.join("uploads", "channels", req.file.filename).replace(/\\\\/g, '/').replace(/\\/g, '/');
    channel.image = imagePath;
    await channel.save();
    if (req.app && req.app.get && req.app.get('io')) {
      const io = req.app.get('io');
      [channel.admin, ...channel.members].forEach(memberId => {
        io.to(memberId.toString()).emit('channel-avatar-updated', { channelId, image: imagePath });
      });
    }
    return res.status(200).json({ message: "Avatar updated", image: imagePath });
  } catch (error) {
    console.error("Error uploading channel avatar:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const addUserToChannel = async (req, res) => {
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
    if (channel.members.map(m => m.toString()).includes(userIdToAdd)) {
      return res.status(400).json({ message: "User is already a member" });
    }
    channel.members.push(userIdToAdd);
    await channel.save();
    if (req.app && req.app.get && req.app.get('io')) {
      const io = req.app.get('io');
      io.to(userIdToAdd).emit('channel-added', { channelId });
    }
    return res.status(200).json({ message: "User added to channel" });
  } catch (error) {
    console.error("Error adding user to channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const leaveChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    if (channel.admin.toString() === userId) {
      return res.status(403).json({ message: "Admin cannot leave channel. Delete instead." });
    }
    channel.members = channel.members.filter(m => m.toString() !== userId);
    await channel.save();
    if (req.app && req.app.get && req.app.get('io')) {
      const io = req.app.get('io');
      io.to(userId).emit('channel-left', { channelId });
    }
    return res.status(200).json({ message: "Left channel" });
  } catch (error) {
    console.error("Error leaving channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const deleteChannel = async (req, res) => {
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
    if (req.app && req.app.get && req.app.get('io')) {
      const io = req.app.get('io');
      channel.members.forEach(memberId => {
        io.to(memberId.toString()).emit('channel-deleted', { channelId });
      });
      io.to(channel.admin.toString()).emit('channel-deleted', { channelId });
    }
    return res.status(200).json({ message: "Channel deleted" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
import mongoose from "mongoose";
import Channel from "../model/ChannelModel.js";
import User from "../model/UserModel.js";
import Message from "../model/MessagesModel.js";

export const createChannel = async (request, response, next) => {
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
      members: validMembers.map(u => u._id),
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

export const getUserChannels = async (req, res) => {
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

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;
    const channel = await Channel.findOne({
      _id: channelId,
      $or: [{ admin: userId }, { members: userId }],
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found or access denied" });
    }
    const messages = await Message.find({
      $and: [
        { _id: { $in: channel.messages } },
        { deleted: { $ne: true } }
      ]
    })
        .populate("sender", "firstName lastName email _id image color")
        .sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting channel messages:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};
