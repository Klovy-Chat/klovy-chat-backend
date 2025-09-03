import Message from "../../model/MessagesModel.js";

const handleEditMessage = async (data, userSocketMap, io) => {
    try {
        const { messageId, content, userId } = data;
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "id email firstName lastName image color")
            .populate("recipient", "id email firstName lastName image color");

        const recipientSocketId = userSocketMap.get(message.recipient?.toString());
        const senderSocketId = userSocketMap.get(message.sender?.toString());

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("message-edited", populatedMessage);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("message-edited", populatedMessage);
        }
    } catch (error) {
        console.error("Error in editMessage (socket):", error);
    }
};

export default handleEditMessage;
