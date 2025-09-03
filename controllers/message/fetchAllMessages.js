import Message from "../../model/MessagesModel.js";

const fetchAllMessages = async (req, res) => {
  try {
    const { id } = req.body;
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: req.user.id, recipient: id },
            { sender: id, recipient: req.user.id },
          ],
        },
        { deleted: { $ne: true } },
      ],
    })
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate("quotedMessage")
      .sort({ timestamp: 1 });

    await Message.updateMany(
      {
        sender: id,
        recipient: req.user.id,
        read: false,
      },
      { read: true },
    );

    res.json({ messages });
  } catch (error) {
    console.error("Error in fetchAllMessages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default fetchAllMessages;
