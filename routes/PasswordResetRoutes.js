import express from 'express';
import passwordResetController from '../controllers/PasswordResetController.js';

const router = express.Router();

router.post('/request-reset', passwordResetController.requestPasswordReset);
router.post('/verify-token', passwordResetController.verifyResetToken);
router.post('/reset', passwordResetController.resetPassword);

export default router;
