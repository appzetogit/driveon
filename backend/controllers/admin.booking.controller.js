import Booking from '../models/Booking.js';
import OutwardBooking from '../models/OutwardBooking.js';
import Car from '../models/Car.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Coupon from '../models/Coupon.js';
import Offer from '../models/Offer.js';
import { reverseGuarantorPoints, refundUsedBookingPoints } from '../utils/guarantorPoints.js';
import { sendPushNotification } from '../services/firebase.service.js';

/**
 * Helper to enrich bookings with Coupon and Offer details
 */
const enrichBookingsWithPromoDetails = async (bookings) => {
  if (!bookings || bookings.length === 0) return bookings;

  // Extract all unique codes
  const couponCodes = new Set();
  const offerCodes = new Set();

  bookings.forEach(booking => {
    const couponCode = booking.pricing?.couponCode;
    const offerCode = booking.pricing?.offerCode;
    if (couponCode) couponCodes.add(couponCode.toUpperCase().trim());
    if (offerCode) offerCodes.add(offerCode.toUpperCase().trim());
  });

  // Query database
  const [coupons, offers] = await Promise.all([
    couponCodes.size > 0 ? Coupon.find({ code: { $in: Array.from(couponCodes) } }).lean() : [],
    offerCodes.size > 0 ? Offer.find({ code: { $in: Array.from(offerCodes) } }).lean() : []
  ]);

  // Create lookup maps
  const couponMap = {};
  coupons.forEach(c => {
    couponMap[c.code] = {
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount,
      description: c.description
    };
  });

  const offerMap = {};
  offers.forEach(o => {
    offerMap[o.code] = {
      code: o.code,
      title: o.title,
      discountType: o.discountType,
      discountValue: o.discountValue,
      description: o.description
    };
  });

  // Enrich bookings
  return bookings.map(booking => {
    const bookingObj = booking.toObject ? booking.toObject() : booking;
    if (bookingObj.pricing) {
      const couponCode = bookingObj.pricing.couponCode;
      const offerCode = bookingObj.pricing.offerCode;

      if (couponCode && couponMap[couponCode.toUpperCase().trim()]) {
        bookingObj.pricing.couponDetails = couponMap[couponCode.toUpperCase().trim()];
      }
      if (offerCode && offerMap[offerCode.toUpperCase().trim()]) {
        bookingObj.pricing.offerDetails = offerMap[offerCode.toUpperCase().trim()];
      }
    }
    return bookingObj;
  });
};

const enrichSingleBookingWithPromoDetails = async (booking) => {
  if (!booking) return booking;
  const enriched = await enrichBookingsWithPromoDetails([booking]);
  return enriched[0];
};

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/admin/bookings
 * @access  Private (Admin)
 */
export const getAllBookings = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      tripStatus,
      page = 1,
      limit = 20,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    // Always filter out unpaid bookings and cancelled bookings that were never paid
    const filterConditions = [
      { status: { $ne: 'unpaid' } },
      {
        $or: [
          { status: { $ne: 'cancelled' } },
          { paidAmount: { $gt: 0 } },
          { paymentStatus: { $in: ['paid', 'partial', 'refunded'] } }
        ]
      }
    ];

    if (status && status !== 'all') {
      query.status = status;
    }

    query.$and = filterConditions;

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (tripStatus && tripStatus !== 'all') {
      query.tripStatus = tripStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.bookingDate = {};
      if (dateFrom) {
        query.bookingDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.bookingDate.$lte = new Date(dateTo);
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const bookings = await Booking.find(query)
      .populate('user', 'name phone email age gender address profilePhoto')
      .populate('car', 'brand model year registrationNumber fuelType transmission seatingCapacity location')
      .populate('guarantor', 'name phone email')
      .populate('assignedDriver', 'name phone email status employeeId')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    // Calculate statistics
    const stats = {
      total,
      pending: await Booking.countDocuments({ ...query, status: 'pending' }),
      confirmed: await Booking.countDocuments({ ...query, status: 'confirmed' }),
      active: await Booking.countDocuments({ ...query, status: 'active' }),
      completed: await Booking.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...query, status: 'cancelled' }),
      totalRevenue: await Booking.aggregate([
        { $match: { ...query, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]).then(result => result[0]?.total || 0),
    };

    const enrichedBookings = await enrichBookingsWithPromoDetails(bookings);

    res.json({
      success: true,
      data: {
        bookings: enrichedBookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get booking by ID (Admin)
 * @route   GET /api/admin/bookings/:id
 * @access  Private (Admin)
 * @note    Supports both MongoDB ObjectId and bookingId string
 */
export const getBookingById = async (req, res) => {
  try {
    console.log('🔍 Get booking by ID - Controller called');
    console.log('📋 Request details:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      params: req.params,
      query: req.query,
    });

    const { id } = req.params;

    console.log('🔍 Get booking by ID request:', { id, params: req.params });

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    const trimmedId = id.trim();
    let booking = null;

    // Check if it's a valid MongoDB ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(trimmedId);
    console.log('📋 Booking ID format check:', { trimmedId, isValidObjectId });

    if (isValidObjectId) {
      // Try to find by MongoDB _id first
      try {
        console.log('🔎 Searching by MongoDB _id...');
        booking = await Booking.findById(trimmedId)
          .populate('user', 'name phone email age gender address profilePhoto')
          .populate('car', 'brand model year color registrationNumber images pricePerDay owner')
          .populate('guarantor', 'name phone email')
          .populate('assignedDriver', 'name phone email status employeeId');

        if (booking) {
          console.log('✅ Booking found by _id:', booking.bookingId || booking._id);
        }
      } catch (findError) {
        // If findById fails, log and continue to search by bookingId
        console.log('⚠️ findById failed, trying bookingId search:', findError.message);
      }
    }

    // If not found by _id, try searching by bookingId string
    if (!booking) {
      try {
        console.log('🔎 Searching by bookingId string...');
        booking = await Booking.findOne({ bookingId: trimmedId })
          .populate('user', 'name phone email age gender address profilePhoto')
          .populate('car', 'brand model year color registrationNumber images pricePerDay owner')
          .populate('guarantor', 'name phone email')
          .populate('assignedDriver', 'name phone email status employeeId');

        if (booking) {
          console.log('✅ Booking found by bookingId:', booking.bookingId);
        } else {
          console.log('❌ No booking found with bookingId:', trimmedId);
        }
      } catch (findOneError) {
        console.error('❌ Error searching by bookingId:', findOneError);
        console.error('Error details:', {
          message: findOneError.message,
          stack: findOneError.stack,
        });
        // Return error instead of 404 if there's a database error
        return res.status(500).json({
          success: false,
          message: 'Error searching for booking',
          error: process.env.NODE_ENV === 'development' ? findOneError.message : undefined,
        });
      }
    }

    if (!booking) {
      console.log('❌ Booking not found for ID:', trimmedId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    console.log('✅ Returning booking:', booking.bookingId || booking._id);
    const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
    res.json({
      success: true,
      data: {
        booking: enrichedBooking,
      },
    });
  } catch (error) {
    console.error('❌ Get booking error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request params:', req.params);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update booking (Admin)
 * @route   PATCH /api/admin/bookings/:id
 * @access  Private (Admin)
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, cancellationReason, paymentStatus, refundAmount, assignedDriver } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Update status if provided
    if (status) {
      booking.status = status;
      if (status === 'confirmed') {
        booking.confirmedAt = new Date();
      } else if (status === 'cancelled') {
        booking.cancelledBy = 'admin';
        booking.cancelledAt = new Date();
        booking.cancellationReason = cancellationReason || '';
        booking.isTrackingActive = false;
        booking.tripStatus = 'cancelled';

        // Update all pending transactions to cancelled
        if (booking.transactions && booking.transactions.length > 0) {
          booking.transactions.forEach(txn => {
            if (txn.status === 'pending') {
              txn.status = 'cancelled';
            }
          });
        }

        // Update payment status to reflect cancellation
        if (booking.paymentStatus === 'pending') {
          booking.paymentStatus = 'failed';
        }

        // Reverse guarantor points and refund used booking points for cancelled booking
        try {
          await reverseGuarantorPoints(booking._id.toString(), cancellationReason || 'Booking cancelled by admin');
          await refundUsedBookingPoints(booking);
        } catch (pointsError) {
          console.error('Error reversing guarantor points / refunding booking points:', pointsError);
          // Don't fail booking cancellation if points reversal fails
        }

        // Sync cancellation to OutwardBooking if it exists
        try {
          await OutwardBooking.findOneAndUpdate(
            {
              $or: [
                { originalBookingId: booking._id.toString() },
                { originalBookingId: booking.bookingId }
              ]
            },
            { status: 'cancelled' }
          );
        } catch (syncError) {
          console.error('Error syncing booking cancellation to OutwardBooking:', syncError);
        }
      } else if (status === 'completed') {
        booking.completedAt = new Date();
        booking.tripStatus = 'completed';
        booking.isTrackingActive = false;
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
      // If payment status is set to "paid", update paidAmount to totalAmount
      if (paymentStatus === 'paid' && booking.paidAmount < booking.pricing?.totalPrice) {
        booking.paidAmount = booking.pricing?.totalPrice || booking.totalPrice || 0;
      }
      // If payment status is set to "refunded", set refund date, 100% refund, update transactions & create general Transaction
      if (paymentStatus === 'refunded') {
        booking.refundDate = new Date();
        const refundAmt = booking.paidAmount || 0;
        booking.refundAmount = refundAmt;

        // Update all transaction statuses in the booking
        if (booking.transactions && booking.transactions.length > 0) {
          booking.transactions.forEach(txn => {
            if (txn.status === 'success' || txn.status === 'pending') {
              txn.status = 'refunded';
              txn.refundDate = new Date();
              txn.refundAmount = txn.amount;
            }
          });
        }

        // Create transaction in CRM for P&L tracking
        try {
          await Transaction.create({
            type: 'Cash Out',
            category: 'Refund',
            amount: refundAmt,
            paymentMethod: 'UPI', // Standard default
            description: `Refund for Booking: ${booking.bookingId || booking._id}`,
            referenceId: booking._id.toString(),
            date: new Date()
          });
        } catch (txnError) {
          console.error('Error creating refund transaction record in CRM:', txnError);
        }
      }
    }

    // Update refund amount if provided
    if (refundAmount !== undefined && paymentStatus !== 'refunded') {
      booking.refundAmount = refundAmount;
    }

    // Update admin notes
    if (adminNotes !== undefined) {
      booking.adminNotes = adminNotes;
    }

    if (assignedDriver !== undefined) {
      booking.assignedDriver = assignedDriver || null;
    }

    await booking.save();

    // Send Push Notification based on status
    if (status) {
      let notificationTitle = "";
      let notificationBody = "";
      const bIdentifier = booking.bookingId || booking._id;

      if (status === 'confirmed') {
        notificationTitle = "Booking Confirmed";
        notificationBody = `Yay! Your ride #${bIdentifier} is confirmed!`;
      } else if (status === 'cancelled') {
        notificationTitle = "Booking Cancelled";
        notificationBody = "Booking Cancelled. Refund initiated.";
      } else if (status === 'completed') {
        notificationTitle = "Trip Completed";
        notificationBody = "Trip Completed. Invoice generated.";
      }

      if (notificationTitle && booking.user) {
        console.log(`📣 Sending ${status} notification to user ${booking.user}`);
        
        // Payload for Background & Foreground (Real-time)
        const payload = {
            notification: {
                title: notificationTitle,
                body: notificationBody,
            },
            data: {
                bookingId: bIdentifier.toString(),
                status: status,
                type: 'booking_update',
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };

        // Send to both Web and Mobile
        // We use the new signature: (userId, payload, isMobile)
        sendPushNotification(booking.user, payload, false);
        sendPushNotification(booking.user, payload, true);
      }
    }

    const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: {
        booking: enrichedBooking,
      },
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get active bookings with tracking (Admin)
 * @route   GET /api/admin/bookings/active/tracking
 * @access  Private (Admin)
 */
export const getActiveBookingsWithTracking = async (req, res) => {
  try {
    const bookings = await Booking.find({
      isTrackingActive: true,
      status: { $in: ['confirmed', 'active'] },
      tripStatus: { $in: ['started', 'in_progress'] },
    })
      .populate('user', 'name phone email age gender address profilePhoto')
      .populate('car', 'brand model year color registrationNumber images')
      .select('bookingId user car tripStart tripEnd currentLocation lastLocationUpdate isTrackingActive status tripStatus createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
      },
    });
  } catch (error) {
    console.error('Get active bookings with tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get booking statistics (Admin)
 * @route   GET /api/admin/bookings/stats
 * @access  Private (Admin)
 */
export const getBookingStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateQuery = {};
    if (dateFrom || dateTo) {
      dateQuery.bookingDate = {};
      if (dateFrom) {
        dateQuery.bookingDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateQuery.bookingDate.$lte = new Date(dateTo);
      }
    }

    const [
      totalBookings,
      totalRevenue,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingPayments,
      revenueByStatus,
    ] = await Promise.all([
      Booking.countDocuments(dateQuery),
      Booking.aggregate([
        { $match: { ...dateQuery, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Booking.countDocuments({ ...dateQuery, status: 'active' }),
      Booking.countDocuments({ ...dateQuery, status: 'completed' }),
      Booking.countDocuments({ ...dateQuery, status: 'cancelled' }),
      Booking.countDocuments({ ...dateQuery, paymentStatus: 'pending' }),
      Booking.aggregate([
        { $match: { ...dateQuery, paymentStatus: 'paid' } },
        {
          $group: {
            _id: '$status',
            revenue: { $sum: '$paidAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeBookings,
        completedBookings,
        cancelledBookings,
        pendingPayments,
        revenueByStatus: revenueByStatus.reduce((acc, item) => {
          acc[item._id] = {
            revenue: item.revenue,
            count: item.count,
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
/**
 * @desc    Complete booking with remaining payment collection (Admin)
 * @route   POST /api/admin/bookings/:id/complete
 * @access  Private (Admin)
 * Body: { paymentMode: 'online'|'cash'|'partial', transactionId?, receivedBy?, onlineAmount?, cashAmount? }
 */
export const completeBookingWithPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, transactionId, receivedBy, onlineAmount, cashAmount } = req.body;

    if (!paymentMode || !['online', 'cash', 'partial', 'none'].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: 'Invalid paymentMode. Must be online, cash, partial, or none.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}` });
    }

    const totalPrice = (booking.pricing?.totalPrice || 0) - (booking.pricing?.discount || 0);
    const alreadyPaid = booking.paidAmount || 0;
    const remaining = Math.max(0, totalPrice - alreadyPaid);

    // Generate unique transaction ID prefix for manual payments
    const generateTxnId = (prefix) =>
      `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const now = new Date();

    // If no remaining amount, skip payment recording and directly complete
    if (remaining === 0) {
      booking.remainingAmount = 0;
      booking.paymentStatus = 'paid';
      booking.status = 'completed';
      booking.completedAt = now;
      booking.tripStatus = 'completed';
      booking.isTrackingActive = false;
      await booking.save();

      if (booking.user) {
        const bId = booking.bookingId || booking._id;
        sendPushNotification(booking.user, {
          notification: { title: 'Trip Completed', body: `Your booking #${bId} is completed. Thank you for choosing DriveOn!` },
          data: { bookingId: bId.toString(), status: 'completed', type: 'booking_update' },
        }, false);
        sendPushNotification(booking.user, {
          notification: { title: 'Trip Completed', body: `Your booking #${bId} is completed. Thank you for choosing DriveOn!` },
          data: { bookingId: bId.toString(), status: 'completed', type: 'booking_update' },
        }, true);
      }

      const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
      return res.json({ success: true, message: 'Booking completed successfully', data: { booking: enrichedBooking } });
    }

    if (!paymentMode || !['online', 'cash', 'partial', 'none'].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: 'Invalid paymentMode. Must be online, cash, partial, or none.' });
    }

    if (paymentMode === 'online') {
      if (!transactionId || !transactionId.trim()) {
        return res.status(400).json({ success: false, message: 'Transaction ID is required for online payment' });
      }
      booking.transactions.push({
        transactionId: transactionId.trim(),
        amount: remaining,
        status: 'success',
        paymentMethod: 'online',
        paymentDate: now,
      });
      booking.paidAmount = alreadyPaid + remaining;

    } else if (paymentMode === 'cash') {
      if (!receivedBy || !receivedBy.trim()) {
        return res.status(400).json({ success: false, message: 'Received By name is required for cash payment' });
      }
      booking.transactions.push({
        transactionId: generateTxnId('CASH'),
        amount: remaining,
        status: 'success',
        paymentMethod: 'cash',
        receivedBy: receivedBy.trim(),
        paymentDate: now,
      });
      booking.paidAmount = alreadyPaid + remaining;

    } else if (paymentMode === 'partial') {
      const oAmt = parseFloat(onlineAmount) || 0;
      const cAmt = parseFloat(cashAmount) || 0;

      if (oAmt < 0 || cAmt < 0) {
        return res.status(400).json({ success: false, message: 'Amounts cannot be negative' });
      }
      if (Math.round(oAmt + cAmt) !== Math.round(remaining)) {
        return res.status(400).json({
          success: false,
          message: `Online (${oAmt}) + Cash (${cAmt}) must equal remaining amount (${remaining})`
        });
      }
      if (oAmt > 0) {
        if (!transactionId || !transactionId.trim()) {
          return res.status(400).json({ success: false, message: 'Transaction ID is required for the online portion' });
        }
        booking.transactions.push({
          transactionId: transactionId.trim(),
          amount: oAmt,
          status: 'success',
          paymentMethod: 'online',
          paymentDate: now,
        });
      }
      if (cAmt > 0) {
        if (!receivedBy || !receivedBy.trim()) {
          return res.status(400).json({ success: false, message: 'Received By name is required for the cash portion' });
        }
        booking.transactions.push({
          transactionId: generateTxnId('CASH'),
          amount: cAmt,
          status: 'success',
          paymentMethod: 'cash',
          receivedBy: receivedBy.trim(),
          paymentDate: now,
        });
      }
      booking.paidAmount = alreadyPaid + oAmt + cAmt;
    }

    // Finalise the booking
    booking.remainingAmount = 0;
    booking.paymentStatus = 'paid';
    booking.status = 'completed';
    booking.completedAt = now;
    booking.tripStatus = 'completed';
    booking.isTrackingActive = false;

    await booking.save();

    // Push notification to user
    if (booking.user) {
      const bId = booking.bookingId || booking._id;
      const payload = {
        notification: {
          title: 'Trip Completed',
          body: `Your booking #${bId} is completed. Thank you for choosing DriveOn!`,
        },
        data: {
          bookingId: bId.toString(),
          status: 'completed',
          type: 'booking_update',
        },
      };
      sendPushNotification(booking.user, payload, false);
      sendPushNotification(booking.user, payload, true);
    }

    const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
    res.json({
      success: true,
      message: 'Booking completed and payment recorded successfully',
      data: { booking: enrichedBooking },
    });
  } catch (error) {
    console.error('completeBookingWithPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

