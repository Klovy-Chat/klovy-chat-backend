import Message from "../../model/MessagesModel.js";

const sendMessage = async (message, userSocketMap, io) => {
  try {
    if (!message.sender || !message.recipient) {
      console.error("Missing required fields in message:", message);
      return;
    }

    const recipientSocketId = userSocketMap.get(message.recipient);
    const senderSocketId = userSocketMap.get(message.sender);
    const messageType = message.messageType?.toUpperCase() || "TEXT";

    const createdMessage = await Message.create({
      ...message,
      messageType,
      timestamp: new Date(),
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .exec();

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
  }
};

export default sendMessage;
