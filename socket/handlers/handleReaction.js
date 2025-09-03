import Message from "../../model/MessagesModel.js";

const handleReaction = async (data, userSocketMap, io) => {
  try {
    const { messageId, emoji, userId } = data;
    if (!messageId || !emoji || !userId) {
      console.error("Missing required fields in reaction data:", data);
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) return;

    const reactions = message.reactions || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    } else {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    message.reactions = reactions;
    await message.save();

    const reactionsMap = new Map();
    Object.entries(reactions).forEach(([emoji, userIds]) => {
      reactionsMap.set(emoji, userIds);
    });

    const recipientSocketId = userSocketMap.get(message.recipient);
    const senderSocketId = userSocketMap.get(message.sender);

    const reactionData = {
      messageId,
      reactions: Object.fromEntries(reactionsMap),
    };

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("message-reaction", reactionData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-reaction", reactionData);
    }
  } catch (error) {
    console.error("Error in handleReaction:", error);
  }
};

export default handleReaction;
