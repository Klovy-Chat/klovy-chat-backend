import User from "../model/UserModel.js";

export const approveUser = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "User ID required." });
    }
    try {
        const user = await User.findByIdAndUpdate(userId, { isWhitelisted: true }, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User approved.", user });
    } catch (err) {
        return res.status(500).json({ message: "Error approving user." });
    }
};
