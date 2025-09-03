import Message from "../../model/MessagesModel.js";

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    await Message.findByIdAndUpdate(messageId, {
      deleted: true,
      deletedAt: new Date(),
    });

    if (req.app && req.app.get("io")) {
      req.app
        .get("io")
        .to(message.recipient?.toString())
        .emit("message-deleted", { _id: messageId });
      req.app
        .get("io")
        .to(message.sender?.toString())
        .emit("message-deleted", { _id: messageId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default deleteMessage;
