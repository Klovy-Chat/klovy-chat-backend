import Message from "../../model/MessagesModel.js";
import Channel from "../../model/ChannelModel.js";

const sendChannelMessage = async (message, userSocketMap, io) => {
    try {
        if (!message.channelId || !message.sender) {
            console.error("Missing required fields in channel message:", message);
            return;
        }

        const { channelId, sender, content, messageType, fileUrl, quotedMessage } = message;
        const normalizedMessageType = messageType?.toUpperCase() || "TEXT";

        const createdMessage = await Message.create({
            sender,
            recipient: null,
            content,
            messageType: normalizedMessageType,
            timestamp: new Date(),
            fileUrl,
            quotedMessage,
        });

        const messageData = await Message.findById(createdMessage._id)
            .populate("sender", "id email firstName lastName image color")
            .exec();

        await Channel.findByIdAndUpdate(channelId, {
            $push: { messages: createdMessage._id },
        });

        const channel = await Channel.findById(channelId).populate("members admin");
        if (!channel) {
            console.error("Channel not found:", channelId);
            return;
        }

        const finalData = { ...messageData._doc, channelId: channel._id };

        if (channel.members) {
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit("receive-channel-message", finalData);
                }
            });
        }

        if (channel.admin) {
            const adminSocketId = userSocketMap.get(channel.admin._id.toString());
            if (adminSocketId) {
                io.to(adminSocketId).emit("receive-channel-message", finalData);
            }
        }
    } catch (error) {
        console.error("Error in sendChannelMessage:", error);
    }
};

export default sendChannelMessage;
