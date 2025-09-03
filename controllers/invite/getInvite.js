import Invite from "../../model/InviteModel.js";

const getInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const invite = await Invite.findOne({ inviteId }).populate("channelId");

    if (!invite) return res.status(404).json({ error: "Invite not found" });

    res.json({ invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default getInvite;
