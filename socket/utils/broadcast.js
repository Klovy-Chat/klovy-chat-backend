const broadcastUserStatus = (userId, status, userSocketMap, io) => {
    for (const [otherUserId, socketId] of userSocketMap.entries()) {
        if (otherUserId !== userId) {
            io.to(socketId).emit("user-status-changed", { userId, status });
        }
    }
};

const broadcastProfileUpdate = (userId, updateType, data, userSocketMap, io) => {
    for (const [otherUserId, socketId] of userSocketMap.entries()) {
        if (otherUserId !== userId.toString()) {
            io.to(socketId).emit(updateType, { userId, ...data });
        }
    }
};

export { broadcastUserStatus, broadcastProfileUpdate };
