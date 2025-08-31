import Message from "../model/MessagesModel.js";

export const fetchAllMessages = async (req, res) => {
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
                { deleted: { $ne: true } }
            ]
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
            { read: true }
        );

        res.json({ messages });
    } catch (error) {
        console.error("Error in fetchAllMessages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        const reactions = message.reactions || new Map();
        if (!reactions.has(emoji)) {
            reactions.set(emoji, []);
        }

        const userReactions = reactions.get(emoji);
        if (!userReactions.includes(req.user.id)) {
            userReactions.push(req.user.id);
        } else {
            reactions.set(
                emoji,
                userReactions.filter((id) => id.toString() !== req.user.id)
            );
        }

        message.reactions = reactions;
        await message.save();

        res.json({ message });
    } catch (error) {
        console.error("Error in addReaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const quoteMessage = async (req, res) => {
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

        if (req.app && req.app.get('io')) {
            req.app.get('io').to(message.recipient?.toString()).emit('message-edited', message);
            req.app.get('io').to(message.sender?.toString()).emit('message-edited', message);
        }

        res.json({ message });
    } catch (error) {
        console.error("Error in editMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this message" });
        }
        await Message.findByIdAndUpdate(messageId, { deleted: true, deletedAt: new Date() });
        console.log('Deleted message (by update):', messageId);

        if (req.app && req.app.get('io')) {
            req.app.get('io').to(message.recipient?.toString()).emit('message-deleted', { _id: messageId });
            req.app.get('io').to(message.sender?.toString()).emit('message-deleted', { _id: messageId });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};