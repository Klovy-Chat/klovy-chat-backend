const notifyChannelDeleted = async (channel, userSocketMap, io) => {
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

export default notifyChannelDeleted;
