import { Server as SocketIOServer } from "socket.io";
import Message from "./model/MessagesModel.js";
import Channel from "./model/ChannelModel.js";
import User from "./model/UserModel.js";

const setupSocket = (server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const userSocketMap = new Map();
    const typingUsers = new Map();
    const notifyChannelDeleted = async (channel) => {
        if (!channel) return;
        
        let memberIds = [];
        if (Array.isArray(channel.members)) {
            memberIds = channel.members.map(m => (typeof m === 'object' && m._id ? m._id.toString() : m.toString()));
        }
        
        let adminId = channel.admin;
        if (typeof adminId === 'object' && adminId._id) adminId = adminId._id.toString();
        else adminId = adminId.toString();
        
        memberIds.forEach(memberId => {
            const memberSocketId = userSocketMap.get(memberId);
            if (memberSocketId) {
                io.to(memberSocketId).emit('channel-deleted', { channelId: channel._id });
            }
        });
        
        if (!memberIds.includes(adminId)) {
            const adminSocketId = userSocketMap.get(adminId);
            if (adminSocketId) {
                io.to(adminSocketId).emit('channel-deleted', { channelId: channel._id });
            }
        }
    };

    const addChannelNotify = async (channel) => {
        if (channel && channel.members) {
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit("new-channel-added", channel);
                }
            });
        }
    };

    const sendMessage = async (message) => {
        try {
            if (!message.sender || !message.recipient) {
                console.error("Missing required fields in message:", message);
                return;
            }

            const recipientSocketId = userSocketMap.get(message.recipient);
            const senderSocketId = userSocketMap.get(message.sender);
            const messageType = message.messageType?.toUpperCase() || "TEXT";

            const createdMessage = await Message.create({
                ...message,
                messageType,
                timestamp: new Date(),
            });

            const messageData = await Message.findById(createdMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .populate("recipient", "id email firstName lastName image color")
                .exec();

            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receiveMessage", messageData);
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit("receiveMessage", messageData);
            }
        } catch (error) {
            console.error("Error in sendMessage:", error);
        }
    };

    const sendChannelMessage = async (message) => {
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

    const handleTyping = (data) => {
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

    const handleReaction = async (data) => {
        try {
            const { messageId, emoji, userId } = data;
            if (!messageId || !emoji || !userId) {
                console.error("Missing required fields in reaction data:", data);
                return;
            }

            const message = await Message.findById(messageId);
            if (!message) return;

            const reactions = message.reactions || {};
            if (!reactions[emoji]) {
                reactions[emoji] = [];
            }

            if (!reactions[emoji].includes(userId)) {
                reactions[emoji].push(userId);
            } else {
                reactions[emoji] = reactions[emoji].filter(id => id !== userId);
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                }
            }

            message.reactions = reactions;
            await message.save();

            const reactionsMap = new Map();
            Object.entries(reactions).forEach(([emoji, userIds]) => {
                reactionsMap.set(emoji, userIds);
            });

            const recipientSocketId = userSocketMap.get(message.recipient);
            const senderSocketId = userSocketMap.get(message.sender);

            const reactionData = {
                messageId,
                reactions: Object.fromEntries(reactionsMap)
            };

            if (recipientSocketId) {
                io.to(recipientSocketId).emit('message-reaction', reactionData);
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit('message-reaction', reactionData);
            }
        } catch (error) {
            console.error("Error in handleReaction:", error);
        }
    };

    const markMessageAsRead = async (data) => {
        try {
            const { messageId, userId } = data;
            if (!messageId || !userId) {
                console.error("Missing required fields in markMessageAsRead data:", data);
                return;
            }

            const message = await Message.findById(messageId);
            if (message && message.recipient && message.recipient.toString() === userId) {
                message.read = true;
                await message.save();

                const senderSocketId = userSocketMap.get(message.sender);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message-read', { messageId, read: true });
                }
            }
        } catch (error) {
            console.error("Error in markMessageAsRead:", error);
        }
    };

    const setUserOnline = async (userId) => {
        if (!userId || typeof userId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(userId)) {
            console.error("setUserOnline: userId is invalid!", userId);
            return;
        }
        await User.findByIdAndUpdate(userId, { isOnline: true });
    };

    const setUserOffline = async (userId) => {
        if (!userId || typeof userId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(userId)) {
            console.error("setUserOffline: userId is invalid!", userId);
            return;
        }
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: Date.now() });
    };

    const disconnect = (socket) => {
        try {
            console.log("Client disconnected", socket.id);
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    break;
                }
            }
        } catch (error) {
            console.error("Error in disconnect:", error);
        }
    };

    const broadcastUserStatus = (userId, status) => {
        for (const [otherUserId, socketId] of userSocketMap.entries()) {
            if (otherUserId !== userId) {
                io.to(socketId).emit("user-status-changed", { userId, status });
            }
        }
    };

    const broadcastProfileUpdate = (userId, updateType, data) => {
        for (const [otherUserId, socketId] of userSocketMap.entries()) {
            if (otherUserId !== userId.toString()) {
                io.to(socketId).emit(updateType, { userId, ...data });
            }
        }
    };

    io.on("connection", (socket) => {
        try {
            const userId = socket.handshake.query.userId;
            if (userId) {
                userSocketMap.set(userId, socket.id);
                setUserOnline(userId);
                console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
            } else {
                console.log("User ID not provided during connection.");
            }

            socket.on("add-channel-notify", addChannelNotify);
            socket.on("sendMessage", sendMessage);
            socket.on("send-channel-message", sendChannelMessage);
            socket.on("typing", handleTyping);
            socket.on("message-reaction", handleReaction);
            socket.on("mark-message-read", markMessageAsRead);

            socket.on("set-online", async (data) => {
                if (data.userId) {
                    await setUserOnline(data.userId);
                    broadcastUserStatus(data.userId, { isOnline: true, lastSeen: null });
                }
            });

            socket.on("set-offline", async (data) => {
                if (data.userId) {
                    await setUserOffline(data.userId);
                    broadcastUserStatus(data.userId, { isOnline: false, lastSeen: Date.now() });
                }
            });

            socket.on("editMessage", async (data) => {
                try {
                    const { messageId, content, userId } = data;
                    const message = await Message.findById(messageId);
                    if (!message || message.sender.toString() !== userId) return;

                    message.content = content;
                    message.edited = true;
                    message.editedAt = new Date();
                    await message.save();

                    const populatedMessage = await Message.findById(message._id)
                        .populate("sender", "id email firstName lastName image color")
                        .populate("recipient", "id email firstName lastName image color");

                    const recipientSocketId = userSocketMap.get(message.recipient?.toString());
                    const senderSocketId = userSocketMap.get(message.sender?.toString());

                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit("message-edited", populatedMessage);
                    }
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("message-edited", populatedMessage);
                    }
                } catch (error) {
                    console.error("Error in editMessage (socket):", error);
                }
            });

            socket.on("deleteMessage", async (data) => {
                try {
                    const { messageId, userId } = data;
                    const message = await Message.findById(messageId);
                    if (!message || message.sender.toString() !== userId) return;

                    message.deleted = true;
                    message.deletedAt = new Date();
                    await message.save();

                    const recipientSocketId = userSocketMap.get(message.recipient?.toString());
                    const senderSocketId = userSocketMap.get(message.sender?.toString());

                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit("message-deleted", { _id: messageId });
                    }
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("message-deleted", { _id: messageId });
                    }
                } catch (error) {
                    console.error("Error in deleteMessage (socket):", error);
                }
            });

            socket.on("profile-image-updated", (data) => {
                broadcastProfileUpdate(data.userId, "contact-avatar-updated", { image: data.image });
            });

            socket.on("profile-name-updated", (data) => {
                broadcastProfileUpdate(data.userId, "contact-name-updated", {
                    firstName: data.firstName,
                    lastName: data.lastName
                });
            });

            socket.on("disconnect", async () => {
                disconnect(socket);
                if (userId && typeof userId === 'string' && userId.trim() !== '') {
                    await setUserOffline(userId);
                } else {
                    console.warn("Disconnect: userId is undefined or invalid, skipping setUserOffline.");
                }
            });

        } catch (error) {
            console.error("Error in socket connection:", error);
        }
    });

    io.notifyChannelDeleted = notifyChannelDeleted;

    return io;
};

export default setupSocket;