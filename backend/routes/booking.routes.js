import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  startTrip,
  pickupCustomer,
  startOngoing,
  endTrip,
  updateBookingLocation,
  getDriverAssignedBookings,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create booking
router.post('/', createBooking);

// Get user bookings
router.get('/', getUserBookings);

// Get bookings assigned to current driver
router.get('/driver/assigned', getDriverAssignedBookings);

// Get booking by ID
router.get('/:id', getBookingById);

// Update booking status
router.patch('/:id/status', updateBookingStatus);

// Start trip
router.post('/:id/start', startTrip);

// Pickup customer
router.post('/:id/pickup', pickupCustomer);

// Start ongoing trip
router.post('/:id/ongoing', startOngoing);

// End trip
router.post('/:id/end', endTrip);

// Update booking location (for tracking)
router.post('/:id/location', updateBookingLocation);

export default router;

