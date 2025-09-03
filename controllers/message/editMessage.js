import Message from "../../model/MessagesModel.js";

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this message" });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    if (req.app && req.app.get("io")) {
      req.app
        .get("io")
        .to(message.recipient?.toString())
        .emit("message-edited", message);
      req.app
        .get("io")
        .to(message.sender?.toString())
        .emit("message-edited", message);
    }

    res.json({ message });
  } catch (error) {
    console.error("Error in editMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default editMessage;
