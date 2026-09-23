import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Car from '../models/Car.js';

/**
 * @desc    Get reviews for a specific car
 * @route   GET /api/reviews/car/:carId
 * @access  Public
 */
export const getCarReviews = async (req, res) => {
  try {
    const { carId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);

    // Fetch completed bookings that have reviews for this car
    const skip = (page - 1) * limit;

    const carObjectId = new mongoose.Types.ObjectId(carId);
    const [reviews, total] = await Promise.all([
      Booking.find({
        car: carObjectId,
        status: 'completed',
        userRating: { $exists: true, $gt: 0 },
      })
        .populate('user', 'name profileImage')
        .select('userRating userReview createdAt user bookingId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Booking.countDocuments({
        car: carObjectId,
        status: 'completed',
        userRating: { $exists: true, $gt: 0 },
      }),
    ]);

    // Compute aggregate rating
    const ratingAgg = await Booking.aggregate([
      { $match: { car: carObjectId, status: 'completed', userRating: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$userRating' },
          count1: { $sum: { $cond: [{ $eq: ['$userRating', 1] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ['$userRating', 2] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ['$userRating', 3] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ['$userRating', 4] }, 1, 0] } },
          count5: { $sum: { $cond: [{ $eq: ['$userRating', 5] }, 1, 0] } },
        },
      },
    ]);

    const agg = ratingAgg[0] || {};

    return res.json({
      success: true,
      data: {
        reviews: reviews.map((b) => ({
          id: b._id,
          bookingId: b.bookingId,
          rating: b.userRating,
          comment: b.userReview,
          user: b.user,
          createdAt: b.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        ratings: {
          averageRating: agg.avgRating ? Math.round(agg.avgRating * 10) / 10 : 0,
          ratingDistribution: {
            5: agg.count5 || 0,
            4: agg.count4 || 0,
            3: agg.count3 || 0,
            2: agg.count2 || 0,
            1: agg.count1 || 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching car reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch car reviews',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit a review for a completed booking
 * @route   POST /api/reviews
 * @access  Private (authenticated user)
 * Body: { bookingId, rating, comment }
 */
export const submitReview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment is required' });
    }

    // Find the booking — support both Mongo ObjectId and custom bookingId string
    let booking = null;

    // Try ObjectId first
    if (bookingId.match(/^[a-fA-F0-9]{24}$/)) {
      booking = await Booking.findById(bookingId);
    }
    // Fall back to custom bookingId field
    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only review your own bookings' });
    }

    // Only allow reviews for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings',
      });
    }

    // Prevent duplicate reviews
    if (booking.userRating && booking.userRating > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    // Save review to booking
    booking.userRating = parseInt(rating, 10);
    booking.userReview = comment.trim();
    await booking.save();

    // Update car's average rating
    if (booking.car) {
      const ratingAgg = await Booking.aggregate([
        {
          $match: {
            car: booking.car,
            status: 'completed',
            userRating: { $exists: true, $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$userRating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (ratingAgg.length > 0) {
        await Car.findByIdAndUpdate(booking.car, {
          averageRating: Math.round(ratingAgg[0].avgRating * 10) / 10,
          totalReviews: ratingAgg[0].totalReviews,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        bookingId: booking.bookingId || booking._id,
        rating: booking.userRating,
        comment: booking.userReview,
      },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
