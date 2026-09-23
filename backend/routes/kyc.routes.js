import express from 'express';
import { 
  generateAadhaarOTP, 
  verifyAadhaarOTP, 
  verifyPAN, 
  verifyDL 
} from '../controllers/kyc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All KYC routes are protected
router.use(authenticate);

// Aadhaar routes
router.post('/aadhaar/generate-otp', generateAadhaarOTP);
router.post('/aadhaar/verify-otp', verifyAadhaarOTP);

// PAN route
router.post('/pan/verify', verifyPAN);

// DL route
router.post('/dl/verify', verifyDL);

export default router;
