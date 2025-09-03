import Message from "../../model/MessagesModel.js";

const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const reactions = message.reactions || new Map();
    if (!reactions.has(emoji)) {
      reactions.set(emoji, []);
    }

    const userReactions = reactions.get(emoji);
    if (!userReactions.includes(req.user.id)) {
      userReactions.push(req.user.id);
    } else {
      reactions.set(
        emoji,
        userReactions.filter((id) => id.toString() !== req.user.id),
      );
    }

    message.reactions = reactions;
    await message.save();

    res.json({ message });
  } catch (error) {
    console.error("Error in addReaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default addReaction;
