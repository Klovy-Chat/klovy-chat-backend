import Message from "../../model/MessagesModel.js";
import mongoose from "mongoose";

const getMessages = async (req, res, next) => {
  try {
    const user1 = req.user.id;
    const user2 = req.body.id;

    if (!user1 || !user2) {
      return res.status(400).send("Both user IDs are required.");
    }

    if (
      !mongoose.Types.ObjectId.isValid(user1) ||
      !mongoose.Types.ObjectId.isValid(user2)
    ) {
      return res.status(400).send("Invalid user ID format.");
    }

    if (user1 !== req.userId && user1 !== req.user?.id) {
      return res.status(403).send("Access denied.");
    }

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: user1, recipient: user2 },
            { sender: user2, recipient: user1 },
          ],
        },
        { deleted: { $ne: true } },
      ],
    })
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export default getMessages;
