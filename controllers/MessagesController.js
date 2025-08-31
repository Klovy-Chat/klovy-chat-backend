import Message from "../model/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (req, res, next) => {
  try {
    const user1 = req.user.id;
    const user2 = req.body.id;
    if (!user1 || !user2) {
      return res.status(400).send("Both user IDs are required.");
    }

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: user1, recipient: user2 },
            { sender: user2, recipient: user1 },
          ],
        },
        { deleted: { $ne: true } }
      ]
    })
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color")
        .sort({ timestamp: 1 });

    console.log('getMessages: user1', user1, 'user2', user2);
    console.log('getMessages: query', JSON.stringify({
      $and: [
        {
          $or: [
            { sender: user1, recipient: user2 },
            { sender: user2, recipient: user1 },
          ],
        },
        { deleted: { $ne: true } }
      ]
    }));
    console.log('getMessages: found', messages.length, 'messages');

    return res.status(200).json({ messages });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const uploadFile = async (request, response, next) => {
  try {
    if (request.file) {
      const allowedExt = ["pdf", "jpg", "jpeg", "png", "webp", "docx", "xlsx", "txt"];
      const ext = request.file.originalname.split('.').pop().toLowerCase();
      if (!allowedExt.includes(ext)) {
        return response.status(400).send("Invalid file type.");
      }
      const userId = request.user?.id || "anon";
      const timestamp = Date.now();
      let fileDir = `uploads/files/${timestamp}`;
      let fileName = `${fileDir}/${userId}-${timestamp}.${ext}`;

      mkdirSync(fileDir, { recursive: true });

      renameSync(request.file.path, fileName);
      return response.status(200).json({ filePath: fileName });
    } else {
      return response.status(404).send("File is required.");
    }
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this message" });
    }
    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    res.json({ message });
  } catch (error) {
    console.error("Error in editMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
