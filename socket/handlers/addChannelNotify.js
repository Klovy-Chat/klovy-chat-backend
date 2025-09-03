const addChannelNotify = async (channel, userSocketMap, io) => {
  if (channel && channel.members) {
    channel.members.forEach((member) => {
      const memberSocketId = userSocketMap.get(member.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("new-channel-added", channel);
      }
    });
  }
};

export default addChannelNotify;
