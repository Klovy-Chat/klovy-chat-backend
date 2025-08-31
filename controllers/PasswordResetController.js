import { sendResetPasswordEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import User from "../model/UserModel.js";
import bcrypt from 'bcrypt';
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 10);

        user.resetPasswordToken = hash;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        await sendResetPasswordEmail(user.email, resetToken);

        res.status(200).json({ message: "Reset password email sent" });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: "Error processing password reset request" });
    }
};

export const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const user = await User.findOne({
            resetPasswordToken: { $ne: null },
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token is invalid or has expired" });
        }

        const isValid = await bcrypt.compare(token, user.resetPasswordToken);
        
        if (!isValid) {
            return res.status(400).json({ message: "Invalid reset token" });
        }

        return res.status(200).json({ message: "Token is valid" });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ message: "Error verifying token" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log('Received reset password request with token:', token ? token.substring(0, 10) + '...' : 'none');

        if (!token || !newPassword) {
            console.log('Missing required fields:', { hasToken: !!token, hasPassword: !!newPassword });
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const users = await User.find({
            resetPasswordToken: { $ne: null },
            resetPasswordExpires: { $gt: Date.now() }
        });

        console.log('Found users with active tokens:', users.length);

        let matchedUser = null;
        for (const user of users) {
            try {
                console.log('Checking user:', user.email);
                console.log('Stored reset token (hashed):', user.resetPasswordToken);
                console.log('Token expiry:', new Date(user.resetPasswordExpires));
                
                const isValid = await bcrypt.compare(token, user.resetPasswordToken);
                console.log('Token comparison result for user:', user.email, isValid);
                
                if (isValid) {
                    matchedUser = user;
                    console.log('Found matching user:', user.email);
                    break;
                }
            } catch (err) {
                console.error('Error comparing token for user:', user.email, err);
            }
        }

        if (!matchedUser) {
            console.log('No user found with matching token');
            return res.status(400).json({ message: "Password reset token is invalid or has expired" });
        }

        if (!matchedUser) {
            console.log('No user found with matching token');
            return res.status(400).json({ message: "Password reset token is invalid or has expired" });
        }

        console.log('Found user with matching token:', matchedUser.email);
        console.log('Setting new password for user:', matchedUser.email);

    matchedUser.password = newPassword;
    matchedUser.resetPasswordToken = null;
    matchedUser.resetPasswordExpires = null;
    matchedUser.tokenVersion = (matchedUser.tokenVersion || 0) + 1;
        
        try {
            await matchedUser.save();
            console.log('User password updated successfully');
            
            const isPasswordValid = await matchedUser.comparePassword(newPassword);
            console.log('Password verification after save:', isPasswordValid);
            
            if (!isPasswordValid) {
                throw new Error('Password was not properly saved');
            }
        } catch (error) {
            console.error('Error saving new password:', error);
            throw error;
        }
        console.log('User updated successfully');

        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: "Error resetting password" });
    }
};

export default {
    requestPasswordReset,
    verifyResetToken,
    resetPassword
};
