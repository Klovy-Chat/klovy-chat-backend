import Message from "../../model/MessagesModel.js";

const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const contactId = req.params.contactId;

    if (!userId || !contactId) {
      return res.status(400).json({ message: "Missing user or contact id" });
    }

    await Message.deleteMany({
      $or: [
        { sender: userId, recipient: contactId },
        { sender: contactId, recipient: userId },
      ],
    });

    return res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default deleteConversation;
