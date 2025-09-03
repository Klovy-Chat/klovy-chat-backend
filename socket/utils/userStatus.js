import User from "../../model/UserModel.js";

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

export { setUserOnline, setUserOffline };
