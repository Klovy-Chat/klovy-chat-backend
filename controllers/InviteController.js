import Invite from '../model/InviteModel.js';
import Channel from '../model/ChannelModel.js';
import User from '../model/UserModel.js';
import { v4 as uuidv4 } from 'uuid';

const InviteController = {
  createInvite: async (req, res) => {
    try {
      const { id } = req.params; 
      const userId = req.user.id;
      const channel = await Channel.findById(id).populate('admin');
      if (!channel) return res.status(404).json({ error: 'Channel not found' });
      const adminId = channel.admin && channel.admin._id ? channel.admin._id : channel.admin;
      console.log('Porównanie adminId:', String(adminId), 'userId:', String(userId));
      if (String(adminId) !== String(userId)) {
        return res.status(403).json({ error: 'Only the channel owner can create invites' });
      }
      const invite = await Invite.create({
        inviteId: uuidv4(),
        channelId: id,
        createdBy: userId,
        expiresAt: null 
      });
      res.json({ inviteId: invite.inviteId, url: `https://chat.klovy.org/invite/${invite.inviteId}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getInvite: async (req, res) => {
    try {
      const { inviteId } = req.params;
      const invite = await Invite.findOne({ inviteId }).populate('channelId');
      if (!invite) return res.status(404).json({ error: 'Invite not found' });
      res.json({ invite });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  acceptInvite: async (req, res) => {
    try {
      const { inviteId } = req.params;
      const userId = req.userId;
      const invite = await Invite.findOne({ inviteId });
      if (!invite) return res.status(404).json({ error: 'Invite not found' });
      if (invite.used) return res.status(400).json({ error: 'Invite already used' });
      const channel = await Channel.findById(invite.channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });
      let membersSet = new Set();
      let validMembers = [];
      if (channel.admin) {
        membersSet.add(String(channel.admin));
        validMembers.push(channel.admin);
      }
      if (Array.isArray(channel.members)) {
        for (const m of channel.members) {
          if (m && !membersSet.has(String(m))) {
            membersSet.add(String(m));
            validMembers.push(m);
          }
        }
      }
      if (userId && !membersSet.has(String(userId))) {
        const userExists = await User.exists({ _id: userId });
        if (userExists) {
          membersSet.add(String(userId));
          validMembers.push(userId);
        }
      }
      const allValidUsers = await User.find({ _id: { $in: validMembers } }, { _id: 1 });
      const allValidIds = new Set(allValidUsers.map(u => String(u._id)));
      channel.members = validMembers.filter(id => allValidIds.has(String(id)));
      await channel.save();
      invite.used = true;
      await invite.save();
      res.json({ success: true, channelId: channel._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export default InviteController;
