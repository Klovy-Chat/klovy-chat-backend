import Invite from "../../model/InviteModel.js";
import Channel from "../../model/ChannelModel.js";
import { v4 as uuidv4 } from "uuid";

const createInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(id).populate("admin");

    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const adminId =
      channel.admin && channel.admin._id ? channel.admin._id : channel.admin;

    if (String(adminId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "Only the channel owner can create invites" });
    }

    const invite = await Invite.create({
      inviteId: uuidv4(),
      channelId: id,
      createdBy: userId,
      expiresAt: null,
    });

    res.json({
      inviteId: invite.inviteId,
      url: `https://chat.klovy.org/invite/${invite.inviteId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default createInvite;
