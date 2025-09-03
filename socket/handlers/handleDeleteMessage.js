import Message from "../../model/MessagesModel.js";

const handleDeleteMessage = async (data, userSocketMap, io) => {
    try {
        const { messageId, userId } = data;
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;

        message.deleted = true;
        message.deletedAt = new Date();
        await message.save();

        const recipientSocketId = userSocketMap.get(message.recipient?.toString());
        const senderSocketId = userSocketMap.get(message.sender?.toString());

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("message-deleted", { _id: messageId });
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("message-deleted", { _id: messageId });
        }
    } catch (error) {
        console.error("Error in deleteMessage (socket):", error);
    }
};

export default handleDeleteMessage;
