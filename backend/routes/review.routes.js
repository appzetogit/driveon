import express from 'express';
import { getCarReviews, submitReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get reviews for a car — public
router.get('/car/:carId', getCarReviews);

// Submit a review — requires authentication
router.post('/', authenticate, submitReview);

export default router;
