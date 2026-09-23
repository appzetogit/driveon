import express from 'express';
import { updateLocation } from '../controllers/location.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Update location (for users/guarantors)
// Route: POST /api/location/update
router.post('/update', authenticate, updateLocation);

export default router;

