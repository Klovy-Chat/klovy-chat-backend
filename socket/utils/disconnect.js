const disconnect = (socket, userSocketMap) => {
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

export default disconnect;
