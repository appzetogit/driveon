import Booking from '../models/Booking.js';
import OutwardBooking from '../models/OutwardBooking.js';
import Car from '../models/Car.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Offer from '../models/Offer.js';
import AddOnServices from '../models/AddOnServices.js';
import { processReferralTripCompletion } from './referral.controller.js';
import { reverseGuarantorPoints, refundUsedBookingPoints } from '../utils/guarantorPoints.js';
import { sendPushNotification, sendAdminNotification } from '../services/firebase.service.js';
import { createAdminNotification } from './notification.controller.js';

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
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
export const createBooking = async (req, res) => {
  try {
    const {
      carId,
      tripStart,
      tripEnd,
      paymentOption,
      specialRequests,
      couponCode,
      offerCode,
      addOnServices, // Optional: { driver: 0, bodyguard: 0, gunmen: 0, bouncer: 0 }
      pointsUsed,
    } = req.body;

    const userId = req.user._id;

    // Log incoming request for debugging
    console.log('📥 Create booking request:', {
      carId,
      tripStart: tripStart ? {
        location: tripStart.location,
        date: tripStart.date,
        time: tripStart.time,
        hasCoordinates: !!tripStart.coordinates,
      } : null,
      tripEnd: tripEnd ? {
        location: tripEnd.location,
        date: tripEnd.date,
        time: tripEnd.time,
        hasCoordinates: !!tripEnd.coordinates,
      } : null,
      paymentOption,
      userId: userId.toString(),
    });

    // Validate required fields
    if (!carId || !tripStart || !tripEnd) {
      console.error('❌ Missing required fields:', { carId: !!carId, tripStart: !!tripStart, tripEnd: !!tripEnd });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: carId, tripStart, tripEnd',
      });
    }

    // Validate tripStart and tripEnd structure
    if (!tripStart.date || !tripStart.time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields in tripStart: date, time',
        details: {
          date: tripStart.date || 'missing',
          time: tripStart.time || 'missing',
        },
      });
    }

    if (!tripEnd.date || !tripEnd.time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields in tripEnd: date, time',
        details: {
          date: tripEnd.date || 'missing',
          time: tripEnd.time || 'missing',
        },
      });
    }

    // Set default location if not provided (handles both string and structured object formats)
    let pickupLocation = 'Location to be confirmed';
    if (tripStart && tripStart.location) {
      if (typeof tripStart.location === 'object') {
        pickupLocation = tripStart.location.address || tripStart.location.city || JSON.stringify(tripStart.location);
      } else if (typeof tripStart.location === 'string' && tripStart.location.trim() !== '') {
        pickupLocation = tripStart.location.trim();
      }
    }

    let dropLocation = 'Location to be confirmed';
    if (tripEnd && tripEnd.location) {
      if (typeof tripEnd.location === 'object') {
        dropLocation = tripEnd.location.address || tripEnd.location.city || JSON.stringify(tripEnd.location);
      } else if (typeof tripEnd.location === 'string' && tripEnd.location.trim() !== '') {
        dropLocation = tripEnd.location.trim();
      }
    }

    // Validate trip dates - combine date and time for accurate comparison
    let startDate = new Date(tripStart.date);
    let endDate = new Date(tripEnd.date);

    // Validate date objects
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip start date format',
        received: tripStart.date,
      });
    }

    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip end date format',
        received: tripEnd.date,
      });
    }

    // If time is provided, combine date and time
    if (tripStart.time) {
      const timeParts = tripStart.time.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        startDate.setHours(hours, minutes, 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
      }
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    if (tripEnd.time) {
      const timeParts = tripEnd.time.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        endDate.setHours(hours, minutes, 0, 0);
      } else {
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      endDate.setHours(23, 59, 59, 999); // Set to end of day if no time provided
    }

    const now = new Date();
    now.setSeconds(0, 0); // Remove seconds for comparison

    // Check if start date is in the past (allow same day if time is in future)
    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Trip start date and time cannot be in the past',
      });
    }

    // Check if end date is after start date (must be at least 1 hour later)
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Trip end date and time must be after start date and time',
      });
    }

    // Calculate total days
    const diffTime = Math.abs(endDate - startDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Get car details
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Check if car is available
    if (!car.isAvailable || car.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Car is not available for booking',
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        {
          'tripStart.date': { $lte: endDate },
          'tripEnd.date': { $gte: startDate },
        },
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Car is already booked for the selected dates',
      });
    }

    // Check for conflicting inward/outward bookings in OutwardBooking collection
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    const outwardConflictConditions = [
      { carId: carId.toString() }
    ];
    if (car.outwardCarId) {
      outwardConflictConditions.push({ carId: car.outwardCarId });
    }

    const conflictingOutwardBooking = await OutwardBooking.findOne({
      status: 'active',
      fromDate: { $lte: endDateISO },
      toDate: { $gte: startDateISO },
      $or: outwardConflictConditions
    });

    if (conflictingOutwardBooking) {
      return res.status(400).json({
        success: false,
        message: 'Car is already booked for the selected dates (outward/inward)',
      });
    }

    // Calculate pricing
    const basePrice = car.pricePerDay || 0;
    let totalPrice = basePrice * totalDays;

    // Apply dynamic pricing multipliers
    const weekendMultiplier = 0; // Disabled 15% weekend surcharge completely
    totalPrice = totalPrice * (1 + weekendMultiplier);

    // Calculate add-on services total
    let addOnServicesTotal = 0;
    let addOnServicesData = {
      driver: 0,
      bodyguard: 0,
      gunmen: 0,
      bouncer: 0,
    };

    if (addOnServices && typeof addOnServices === 'object') {
      try {
        // Get current prices and all services from database
        const dbServices = await AddOnServices.find();
        const prices = await AddOnServices.getPrices();

        // Fallback default pricing if add-on services are unseeded in database
        const defaultPrices = {
          driver: 500,
          bodyguard: 1000,
          gunmen: 1500,
          bouncer: 800,
        };

        const getPrice = (key) => {
          const dbPrice = prices[key];
          return (typeof dbPrice === 'number' && !isNaN(dbPrice)) ? dbPrice : (defaultPrices[key] || 0);
        };

        // Populate quantities dynamically
        const quantities = {
          driver: 0,
          bodyguard: 0,
          gunmen: 0,
          bouncer: 0,
        };

        let calculatedTotal = 0;

        // Iterate over dynamic services
        dbServices.forEach(service => {
          const qty = Math.max(0, parseInt(addOnServices[service.key]) || 0);
          quantities[service.key] = qty;
          calculatedTotal += qty * (prices[service.key] !== undefined ? prices[service.key] : service.price);
        });

        // Ensure legacy keys are initialized if they were not in the dynamic list
        const legacyKeys = ['driver', 'bodyguard', 'gunmen', 'bouncer'];
        legacyKeys.forEach(key => {
          if (quantities[key] === undefined) {
            quantities[key] = Math.max(0, parseInt(addOnServices[key]) || 0);
            calculatedTotal += quantities[key] * getPrice(key);
          }
        });

        addOnServicesTotal = calculatedTotal;
        addOnServicesData = quantities;

        console.log('✅ Add-on services calculated safely:', {
          quantities,
          total: addOnServicesTotal,
        });
      } catch (addOnError) {
        console.error('❌ Error calculating add-on services:', addOnError);
        // Continue without add-on services if there's an error
      }
    }

    // Add add-on services to total price
    totalPrice = totalPrice + addOnServicesTotal;

    // Handle coupon discount if provided
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          // Get car details for coupon validation
          const carType = car.carType;

          // Check if coupon can be applied
          const canApply = coupon.canBeApplied(totalPrice, carId, userId, carType);
          if (canApply.valid) {
            // Calculate discount
            couponDiscount = coupon.calculateDiscount(totalPrice);
            appliedCoupon = coupon;

            // Apply discount to total price
            totalPrice = Math.max(0, totalPrice - couponDiscount);

            console.log('✅ Coupon applied:', {
              code: coupon.code,
              discount: couponDiscount,
              newTotal: totalPrice,
            });
          } else {
            console.warn('⚠️ Coupon cannot be applied:', canApply.message);
            return res.status(400).json({
              success: false,
              message: canApply.message,
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Invalid coupon code',
          });
        }
      } catch (couponError) {
        console.error('❌ Coupon validation error:', couponError);
        return res.status(400).json({
          success: false,
          message: 'Error validating coupon',
          error: process.env.NODE_ENV === 'development' ? couponError.message : undefined,
        });
      }
    }

    // Handle offer discount if provided
    let offerDiscount = 0;
    let appliedOffer = null;
    if (offerCode) {
      try {
        const offer = await Offer.findOne({ code: offerCode.toUpperCase(), isActive: true });
        if (offer) {
          const now = new Date();
          if (now >= offer.validityStart && now <= offer.validityEnd) {
            // Check valid days of week
            if (offer.validDays && offer.validDays.length > 0) {
              const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const currentDay = daysOfWeek[now.getDay()];
              if (!offer.validDays.includes(currentDay)) {
                const dayNamesMap = {
                  'Sun': 'Sunday',
                  'Mon': 'Monday',
                  'Tue': 'Tuesday',
                  'Wed': 'Wednesday',
                  'Thu': 'Thursday',
                  'Fri': 'Friday',
                  'Sat': 'Saturday'
                };
                const fullDays = offer.validDays.map(d => dayNamesMap[d] || d);
                return res.status(400).json({
                  success: false,
                  message: `This offer is only valid on ${fullDays.join(', ')}`,
                });
              }
            }

            // Check first-time-only criteria
            let canApply = true;
            if (offer.isFirstTimeOnly) {

              const bookingsCount = await Booking.countDocuments({
                user: userId,
                status: { $ne: 'cancelled' },
              });
              if (bookingsCount > 0) {
                canApply = false;
              }
            }

            if (canApply) {
              // Calculate discount
              if (offer.discountType === 'percentage') {
                offerDiscount = (totalPrice * offer.discountValue) / 100;
              } else if (offer.discountType === 'fixed') {
                offerDiscount = offer.discountValue;
              } else if (offer.discountType === 'free') {
                offerDiscount = totalPrice;
              }

              offerDiscount = Math.round(offerDiscount * 100) / 100;
              offerDiscount = Math.min(offerDiscount, totalPrice);

              appliedOffer = offer;
              totalPrice = Math.max(0, totalPrice - offerDiscount);

              console.log('✅ Offer applied:', {
                code: offer.code,
                discount: offerDiscount,
                newTotal: totalPrice,
              });
            } else {
              return res.status(400).json({
                success: false,
                message: 'This offer is only valid for first time users',
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              message: 'This offer has expired or is not yet valid',
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Invalid offer code',
          });
        }
      } catch (offerError) {
        console.error('❌ Offer validation error:', offerError);
        return res.status(400).json({
          success: false,
          message: 'Error validating offer',
          error: process.env.NODE_ENV === 'development' ? offerError.message : undefined,
        });
      }
    }

    // Handle points discount if provided
    let pointsDiscount = 0;
    const pointsToUse = Number(pointsUsed) || 0;
    const user = await User.findById(userId);

    if (pointsToUse > 0) {
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      if ((user.points || 0) < pointsToUse) {
        return res.status(400).json({
          success: false,
          message: `Insufficient coins balance. Available: ${user.points || 0}`,
        });
      }

      pointsDiscount = Math.min(pointsToUse, totalPrice);
      totalPrice = Math.max(0, totalPrice - pointsDiscount);

      console.log('✅ Points applied:', {
        pointsToUse,
        discount: pointsDiscount,
        newTotal: totalPrice,
      });
    }

    // Calculate advance payment (dynamic % for advance option)
    const Setting = (await import('../models/Setting.js')).default;
    const dbSetting = await Setting.findOne({ key: 'advancePaymentPercentage' });
    const advancePercentage = dbSetting ? Number(dbSetting.value) : 20;

    const advancePayment = paymentOption === 'advance' ? (totalPrice * (advancePercentage / 100)) : 0;
    const remainingPayment = totalPrice - advancePayment;
    const finalPrice = paymentOption === 'full' ? totalPrice : advancePayment;

    // Prepare coordinates structure
    const startCoordinates = tripStart.coordinates || {};
    const endCoordinates = tripEnd.coordinates || {};

    // Ensure coordinates have proper structure (latitude/longitude as numbers or omit if not provided)
    // Mongoose will handle undefined values, but we need to make sure we don't send empty objects
    const formattedStartCoordinates = {};
    let hasStartCoords = false;
    if (typeof startCoordinates.latitude === 'number' && !isNaN(startCoordinates.latitude)) {
      formattedStartCoordinates.latitude = startCoordinates.latitude;
      hasStartCoords = true;
    }
    if (typeof startCoordinates.longitude === 'number' && !isNaN(startCoordinates.longitude)) {
      formattedStartCoordinates.longitude = startCoordinates.longitude;
      hasStartCoords = true;
    }

    const formattedEndCoordinates = {};
    let hasEndCoords = false;
    if (typeof endCoordinates.latitude === 'number' && !isNaN(endCoordinates.latitude)) {
      formattedEndCoordinates.latitude = endCoordinates.latitude;
      hasEndCoords = true;
    }
    if (typeof endCoordinates.longitude === 'number' && !isNaN(endCoordinates.longitude)) {
      formattedEndCoordinates.longitude = endCoordinates.longitude;
      hasEndCoords = true;
    }

    console.log('📍 Coordinates formatted:', {
      start: hasStartCoords ? formattedStartCoordinates : 'none',
      end: hasEndCoords ? formattedEndCoordinates : 'none',
    });

    // Create booking
    const booking = new Booking({
      user: userId,
      car: carId,
      tripStart: {
        location: pickupLocation,
        coordinates: hasStartCoords ? formattedStartCoordinates : undefined,
        date: startDate,
        time: tripStart.time || '10:00',
      },
      tripEnd: {
        location: dropLocation,
        coordinates: hasEndCoords ? formattedEndCoordinates : undefined,
        date: endDate,
        time: tripEnd.time || '18:00',
      },
      totalDays,
      pricing: {
        basePrice,
        totalPrice: totalPrice + couponDiscount + offerDiscount + pointsDiscount, // Original total before discount
        advancePayment,
        remainingPayment,
        weekendMultiplier,
        timeOfDayMultiplier: 0,
        discount: couponDiscount + offerDiscount + pointsDiscount,
        finalPrice,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        offerCode: appliedOffer ? appliedOffer.code : undefined,
        offerDiscount: offerDiscount,
        addOnServicesTotal,
        pointsUsed: pointsToUse,
        pointsDiscount: pointsDiscount,
      },
      addOnServices: addOnServicesData,
      paymentOption: paymentOption || 'full',
      paymentStatus: 'pending',
      paidAmount: 0,
      remainingAmount: remainingPayment,
      specialRequests: specialRequests || '',
      status: 'unpaid',
    });

    // Log booking object before saving
    console.log('📝 Booking object to save:', {
      user: booking.user?.toString(),
      car: booking.car?.toString(),
      tripStart: {
        location: booking.tripStart?.location,
        date: booking.tripStart?.date,
        time: booking.tripStart?.time,
      },
      tripEnd: {
        location: booking.tripEnd?.location,
        date: booking.tripEnd?.date,
        time: booking.tripEnd?.time,
      },
      totalDays: booking.totalDays,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });

    try {
      await booking.save();
      console.log('✅ Booking saved successfully:', booking.bookingId);

      // Increment coupon usage count if coupon was applied
      if (appliedCoupon) {
        await appliedCoupon.incrementUsage();
        console.log('✅ Coupon usage incremented:', appliedCoupon.code);
      }

      // Deduct used points from user's account
      if (pointsToUse > 0) {
        user.points = Math.max(0, (user.points || 0) - pointsToUse);
        user.totalPointsUsed = (user.totalPointsUsed || 0) + pointsToUse;
        await user.save();
        console.log(`✅ Deducted ${pointsToUse} points from user ${user._id}. New balance: ${user.points}`);
      }
    } catch (saveError) {
      console.error('❌ Booking save error:', saveError);
      console.error('Save error name:', saveError.name);
      console.error('Save error message:', saveError.message);

      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors || {}).map(key => {
          const err = saveError.errors[key];
          return {
            field: key,
            message: err.message,
            value: err.value,
            kind: err.kind,
          };
        });

        console.error('Validation errors:', validationErrors);

        return res.status(400).json({
          success: false,
          message: 'Validation error while creating booking',
          errors: validationErrors,
          error: process.env.NODE_ENV === 'development' ? saveError.message : undefined,
        });
      }
      throw saveError; // Re-throw if not a validation error
    }

    // Populate car and user details
    await booking.populate('car', 'brand model year color images pricePerDay');
    await booking.populate('user', 'name phone email age gender address profilePhoto');

    // Notify admins
    try {
      await createAdminNotification({
        title: 'New Booking Created',
        message: `A new booking (${booking.bookingId}) has been created by ${booking.user?.name || 'User'} for ${booking.car?.brand} ${booking.car?.model}.`,
        type: 'info',
        relatedId: booking._id,
        relatedModel: 'Booking'
      });
    } catch (err) {
      console.error('Error sending admin notification for new booking:', err);
    }

    const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: enrichedBooking,
      },
    });
  } catch (error) {
    console.error('❌ Create booking error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      body: req.body,
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error while creating booking',
        errors: validationErrors,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID already exists. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user bookings
 * @route   GET /api/bookings
 * @access  Private
 */
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('📥 Get User Bookings Request:', {
      userId: userId?.toString(),
      userEmail: req.user?.email,
      status,
      page,
      limit,
    });

    const query = { user: userId };
    
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

    console.log('🔍 Booking Query:', JSON.stringify(query, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First, check total bookings for this user using query
    const totalBookings = await Booking.countDocuments(query);
    console.log(`📊 Total bookings for user ${userId}: ${totalBookings}`);

    // Debug: Check all bookings in database to see user IDs
    if (totalBookings === 0) {
      const allBookings = await Booking.find({}).select('user bookingId').limit(5);
      console.log('🔍 Sample bookings in database (for debugging):');
      allBookings.forEach((b, idx) => {
        console.log(`  Booking ${idx + 1}: user=${b.user?.toString() || b.user}, bookingId=${b.bookingId}`);
      });
    }

    const bookings = await Booking.find(query)
      .populate('car', 'brand model year color images pricePerDay')
      .populate('user', 'name phone email age gender address profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ Found ${bookings.length} bookings for user ${userId}`);

    const total = await Booking.countDocuments(query);

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
      },
    });
  } catch (error) {
    console.error('❌ Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id)
      .populate('car', 'brand model year color images pricePerDay location owner')
      .populate('user', 'name phone email age gender address profilePhoto')
      .populate('guarantor', 'name phone email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user has access to this booking
    if (booking.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const enrichedBooking = await enrichSingleBookingWithPromoDetails(booking);
    res.json({
      success: true,
      data: {
        booking: enrichedBooking,
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update booking status
 * @route   PATCH /api/bookings/:id/status
 * @access  Private
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    if (bookingUserId !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update status
    booking.status = status;
    let notificationTitle = "";
    let notificationBody = "";

    if (status === 'cancelled') {
      booking.cancelledBy = req.user.role === 'admin' ? 'admin' : 'user';
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

      notificationTitle = "Booking Cancelled";
      notificationBody = "Booking Cancelled. Refund initiated.";

      // Reverse guarantor points and refund used booking points for cancelled booking
      try {
        await reverseGuarantorPoints(booking._id.toString(), cancellationReason || 'Booking cancelled');
        await refundUsedBookingPoints(booking);
      } catch (pointsError) {
        console.error('Error reversing guarantor points / refunding booking points:', pointsError);
        // Don't fail booking cancellation if points reversal or refund fails
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

      // Notify admins
      try {
        await createAdminNotification({
          title: 'Booking Cancelled by User',
          message: `Booking (${booking.bookingId}) has been cancelled by ${booking.user?.name || 'User'}. Reason: ${cancellationReason || 'No reason provided'}.`,
          type: 'warning',
          relatedId: booking._id,
          relatedModel: 'Booking'
        });
      } catch (err) {
        console.error('Error sending admin notification for cancelled booking:', err);
      }
    } else if (status === 'confirmed') {
      booking.confirmedAt = new Date();
      notificationTitle = "Booking Confirmed";
      notificationBody = `Yay! Your ride #${booking.bookingId || id} is confirmed!`;
    } else if (status === 'completed') {
      booking.completedAt = new Date();
      booking.tripStatus = 'completed';
      booking.isTrackingActive = false;
      notificationTitle = "Trip Completed";
      notificationBody = "Trip Completed. Invoice generated.";

      // Process referral trip completion
      try {
        await processReferralTripCompletion(booking.user._id.toString());
      } catch (referralError) {
        console.error('Error processing referral trip completion:', referralError);
        // Don't fail status update if referral processing fails
      }
    }

    await booking.save();

    // Send Notification
    if (notificationTitle && booking.user) {
      const uId = booking.user._id || booking.user;
      // Send to Web
      sendPushNotification(uId, notificationTitle, notificationBody, { bookingId: booking.bookingId || id }, false);
      // Send to Mobile
      sendPushNotification(uId, notificationTitle, notificationBody, { bookingId: booking.bookingId || id }, true);
    }

    res.json({
      success: true,
      message: 'Booking status updated',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Start trip (enable tracking)
 * @route   POST /api/bookings/:id/start
 * @access  Private
 */
export const startTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const isAssignedDriver = booking.assignedDriver && booking.assignedDriver.toString() === userId.toString();
    if (bookingUserId !== userId.toString() && req.user.role !== 'admin' && !isAssignedDriver) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Validate booking status — allow confirmed, active, or pending bookings
    if (booking.status !== 'confirmed' && booking.status !== 'active' && booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed or pending to start trip',
      });
    }

    // Check payment status
    if (booking.paymentStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before starting trip',
      });
    }

    // Update booking
    booking.status = 'active';
    booking.tripStatus = 'started';
    booking.isTrackingActive = true;
    booking.trackingStartedAt = new Date();
    booking.tripStartedAt = new Date();

    await booking.save();

    // Send Notification
    if (booking.user) {
      const uId = booking.user._id || booking.user;
      const title = "Trip Started";
      const body = "Your trip has started. Enjoy the ride!";
      // Send to Web
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, false);
      // Send to Mobile
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, true);
    }

    res.json({
      success: true,
      message: 'Trip started successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Pickup customer
 * @route   POST /api/bookings/:id/pickup
 * @access  Private
 */
export const pickupCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const isAssignedDriver = booking.assignedDriver && booking.assignedDriver.toString() === userId.toString();
    if (bookingUserId !== userId.toString() && req.user.role !== 'admin' && !isAssignedDriver) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update booking
    booking.tripStatus = 'picked_up';
    await booking.save();

    // Send Notification
    if (booking.user) {
      const uId = booking.user._id || booking.user;
      const title = "Customer Picked Up";
      const body = "You have been picked up by the driver.";
      // Send to Web
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, false);
      // Send to Mobile
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, true);
    }

    res.json({
      success: true,
      message: 'Customer picked up successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Pickup customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record customer pickup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Start ongoing trip
 * @route   POST /api/bookings/:id/ongoing
 * @access  Private
 */
export const startOngoing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const isAssignedDriver = booking.assignedDriver && booking.assignedDriver.toString() === userId.toString();
    if (bookingUserId !== userId.toString() && req.user.role !== 'admin' && !isAssignedDriver) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update booking
    booking.tripStatus = 'ongoing';
    await booking.save();

    // Send Notification
    if (booking.user) {
      const uId = booking.user._id || booking.user;
      const title = "Trip Ongoing";
      const body = "Your trip is now ongoing.";
      // Send to Web
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, false);
      // Send to Mobile
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, true);
    }

    res.json({
      success: true,
      message: 'Trip set to ongoing successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Start ongoing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set trip to ongoing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    End trip (disable tracking)
 * @route   POST /api/bookings/:id/end
 * @access  Private
 */
export const endTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const isAssignedDriver = booking.assignedDriver && booking.assignedDriver.toString() === userId.toString();
    if (bookingUserId !== userId.toString() && req.user.role !== 'admin' && !isAssignedDriver) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Update booking
    booking.tripStatus = 'completed';
    booking.isTrackingActive = false;
    booking.trackingEndedAt = new Date();
    booking.tripEndedAt = new Date();

    await booking.save();

    // Send Notification
    if (booking.user) {
      const uId = booking.user._id || booking.user;
      const title = "Trip Completed";
      const body = "Trip Completed. Invoice generated.";
      // Send to Web
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, false);
      // Send to Mobile
      sendPushNotification(uId, title, body, { bookingId: booking.bookingId || id }, true);
    }

    // Process referral trip completion
    try {
      await processReferralTripCompletion(booking.user._id.toString());
    } catch (referralError) {
      console.error('Error processing referral trip completion:', referralError);
      // Don't fail booking completion if referral processing fails
    }

    res.json({
      success: true,
      message: 'Trip ended successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('End trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end trip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


/**
 * @desc    Update user location for active booking
 * @route   POST /api/bookings/:id/location
 * @access  Private
 */
export const updateBookingLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, address } = req.body;
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check permissions
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Check if tracking is active
    if (!booking.isTrackingActive) {
      return res.status(400).json({
        success: false,
        message: 'Tracking is not active for this booking',
      });
    }

    // Update location
    booking.currentLocation = {
      latitude,
      longitude,
      address: address || '',
      updatedAt: new Date(),
    };
    booking.lastLocationUpdate = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Location updated',
      data: {
        location: booking.currentLocation,
      },
    });
  } catch (error) {
    console.error('Update booking location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get bookings assigned to a driver
 * @route   GET /api/bookings/driver/assigned
 * @access  Private (Staff/Driver)
 */
export const getDriverAssignedBookings = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { status } = req.query;

    const query = { assignedDriver: driverId };
    
    // Filter unpaid/cancelled similar to user bookings
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

    const bookings = await Booking.find(query)
      .populate('car', 'brand model year color registrationNumber images pricePerDay')
      .populate('user', 'name phone email age gender address profilePhoto')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bookings,
      },
    });
  } catch (error) {
    console.error('Get driver assigned bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


