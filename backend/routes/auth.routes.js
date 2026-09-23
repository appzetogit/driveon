import express from 'express';
import multer from 'multer';
import {
  register,
  sendLoginOTP,
  verifyOTP,
  resendOTP,
  refreshToken,
  logout,
  staffLogin,
  getStaffProfile,
  staffForgotPassword,
  staffResetPassword,
  saveStaffFcmToken,
  saveUserFcmToken,
  deleteStaffAccount,
  uploadStaffPhoto,
  updateStaffProfile,
} from '../controllers/auth.controller.js';
import { authenticate, authenticateStaff } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/auth/register', register);
router.post('/auth/send-login-otp', sendLoginOTP);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/resend-otp', resendOTP);
router.post('/auth/refresh-token', refreshToken);
router.post('/auth/staff-login', staffLogin);
router.post('/auth/staff-forgot-password', staffForgotPassword);
router.post('/auth/staff-reset-password/:resetToken', staffResetPassword);

// Protected routes
router.post('/auth/logout', authenticate, logout);
router.get('/auth/staff-profile', authenticateStaff, getStaffProfile);
router.put('/auth/staff-profile', authenticateStaff, updateStaffProfile);
router.post('/auth/staff-fcm-token', authenticateStaff, saveStaffFcmToken);
router.post('/auth/user-fcm-token', authenticate, saveUserFcmToken);
router.delete('/auth/staff-profile', authenticateStaff, deleteStaffAccount);

// Upload staff photo route with multer middleware
router.post('/auth/staff-upload-photo', authenticateStaff, (req, res, next) => {
  const upload = req.app.locals.upload;
  if (!upload) {
    return res.status(500).json({
      success: false,
      message: 'File upload service not configured',
    });
  }
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      if (err.message) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      return next(err);
    }
    next();
  });
}, uploadStaffPhoto);

export default router;

