import Message from "../../model/MessagesModel.js";

const markMessageAsRead = async (data, userSocketMap, io) => {
  try {
    const { messageId, userId } = data;
    if (!messageId || !userId) {
      console.error("Missing required fields in markMessageAsRead data:", data);
      return;
    }

    const message = await Message.findById(messageId);
    if (
      message &&
      message.recipient &&
      message.recipient.toString() === userId
    ) {
      message.read = true;
      await message.save();

      const senderSocketId = userSocketMap.get(message.sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-read", { messageId, read: true });
      }
    }
  } catch (error) {
    console.error("Error in markMessageAsRead:", error);
  }
};

export default markMessageAsRead;
