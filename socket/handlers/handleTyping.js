import Channel from "../../model/ChannelModel.js";

const handleTyping = (data, typingUsers, userSocketMap, io) => {
    try {
        const { chatId, userId, isTyping } = data;
        if (!chatId || !userId) {
            console.error("Missing required fields in typing data:", data);
            return;
        }

        if (isTyping) {
            typingUsers.set(chatId, {
                ...typingUsers.get(chatId),
                [userId]: true
            });
        } else {
            const chatTypingUsers = typingUsers.get(chatId) || {};
            delete chatTypingUsers[userId];
            typingUsers.set(chatId, chatTypingUsers);
        }

        if (chatId.startsWith('channel_')) {
            const channelId = chatId.replace('channel_', '');
            Channel.findById(channelId).then(channel => {
                if (channel && channel.members) {
                    channel.members.forEach(member => {
                        const memberSocketId = userSocketMap.get(member.toString());
                        if (memberSocketId) {
                            io.to(memberSocketId).emit('typing', { chatId, userId, isTyping });
                        }
                    });
                }
            }).catch(error => {
                console.error("Error in channel typing:", error);
            });
        } else {
            const recipientSocketId = userSocketMap.get(chatId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('typing', { chatId, userId, isTyping });
            }
        }
    } catch (error) {
        console.error("Error in handleTyping:", error);
    }
};

export default handleTyping;
