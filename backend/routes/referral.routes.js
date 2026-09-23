import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getReferralDashboard,
  getMyReferrals,
} from '../controllers/referral.controller.js';

const router = express.Router();

// All referral routes require authentication
router.use(authenticate);

// Get referral dashboard (includes code, points, referrals, and statistics)
router.get('/referrals/dashboard', getReferralDashboard);

// Get user's referrals list
router.get('/referrals', getMyReferrals);

export default router;

