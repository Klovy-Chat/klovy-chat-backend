import Message from "../../model/MessagesModel.js";

const quoteMessage = async (req, res) => {
  try {
    const { messageId, content } = req.body;
    const quotedMessage = await Message.findById(messageId);

    if (!quotedMessage) {
      return res.status(404).json({ error: "Quoted message not found" });
    }

    const newMessage = new Message({
      sender: req.user.id,
      recipient: quotedMessage.sender,
      content,
      quotedMessage: messageId,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate("quotedMessage");

    res.json({ message: populatedMessage });
  } catch (error) {
    console.error("Error in quoteMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default quoteMessage;
