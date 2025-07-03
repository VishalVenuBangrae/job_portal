import express from 'express';
import { register, login, upload, getUserResume, forgotPassword, resetPassword, verifyEmail, forgotPasswordEmail, resetPasswordEmail, resendVerificationEmail, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', upload.single('resume'), register);
router.post('/login', login);
router.get('/users/:id/resume', getUserResume);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password-email', forgotPasswordEmail);
router.post('/reset-password-email', resetPasswordEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/change-password', protect, changePassword);

export default router; 