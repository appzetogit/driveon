import express from 'express';
import {
  createPayment,
  phonepeCallback,
  checkPaymentStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayCallback,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create payment (requires auth)
router.post('/create', authenticate, createPayment);

// Check payment status (requires auth)
router.get('/status/:transactionId', authenticate, checkPaymentStatus);

// PhonePe callback (public webhook)
router.post('/phonepe/callback', phonepeCallback);

// Razorpay routes
router.post('/razorpay/create-order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyRazorpayPayment);
router.all('/razorpay/callback', razorpayCallback);

export default router;

