import Coupon from '../models/Coupon.js';
import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import User from '../models/User.js';

/**
 * @desc    Create a new coupon
 * @route   POST /api/admin/coupons
 * @access  Private (Admin only)
 */
export const createCoupon = async (req, res) => {
  try {
    console.log('📝 Create coupon request:', {
      body: req.body,
      applicableTo: req.body.applicableTo,
      carIds: req.body.carIds,
      carId: req.body.carId,
    });

    const {
      code,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      validityStart,
      validityEnd,
      usageLimit,
      applicableTo,
      carType,
      carId,
      carIds, // Array of car IDs
      userId,
      isActive,
      description,
    } = req.body;

    // Validation
    if (!code || !discountType || !discountValue || !validityStart || !validityEnd || !usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: code, discountType, discountValue, validityStart, validityEnd, usageLimit',
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      });
    }

    // Convert and validate discount value
    const discountValueNum = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue;
    if (isNaN(discountValueNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount value',
      });
    }

    if (discountType === 'percentage' && (discountValueNum < 0 || discountValueNum > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100',
      });
    }

    if (discountType === 'fixed' && discountValueNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount must be positive',
      });
    }

    // Validate dates
    const startDate = new Date(validityStart);
    const endDate = new Date(validityEnd);
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid validity start date',
      });
    }
    
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid validity end date',
      });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Validity end date must be after start date',
      });
    }

    // Validate applicability
    if (applicableTo === 'car_type' && !carType) {
      return res.status(400).json({
        success: false,
        message: 'Car type is required when applicableTo is car_type',
      });
    }

    // Prepare and validate carIds array
    let carIdsArray = [];
    if (applicableTo === 'car_id') {
      // Support both carIds array and single carId for backward compatibility
      if (carIds && Array.isArray(carIds) && carIds.length > 0) {
        carIdsArray = carIds.filter(id => id); // Filter out null/undefined
      } else if (carId) {
        carIdsArray = [carId]; // Backward compatibility
      }
      
      if (carIdsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one car must be selected when applicableTo is car_id',
        });
      }

      // Verify all cars exist
      for (const id of carIdsArray) {
        if (!id) continue; // Skip null/undefined
        const car = await Car.findById(id);
        if (!car) {
          return res.status(404).json({
            success: false,
            message: `Car with ID ${id} not found`,
          });
        }
      }
    }

    if (applicableTo === 'user_id' && !userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required when applicableTo is user_id',
      });
    }

    // Verify user exists if userId provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    // Convert usageLimit to number
    const usageLimitNum = typeof usageLimit === 'string' ? parseInt(usageLimit, 10) : usageLimit;
    if (isNaN(usageLimitNum) || usageLimitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Usage limit must be a positive number',
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: discountValueNum,
      minAmount: minAmount ? (typeof minAmount === 'string' ? parseFloat(minAmount) : minAmount) : 0,
      maxDiscount: maxDiscount ? (typeof maxDiscount === 'string' ? parseFloat(maxDiscount) : maxDiscount) : null,
      validityStart: startDate,
      validityEnd: endDate,
      usageLimit: usageLimitNum,
      applicableTo: applicableTo || 'all',
      carType: carType || null,
      carId: carIdsArray.length === 1 ? carIdsArray[0] : null, // Keep for backward compatibility
      carIds: carIdsArray.length > 0 ? carIdsArray : undefined,
      userId: userId || null,
      validDays: req.body.validDays || [],
      isActive: isActive !== undefined ? isActive : true,
      description: description || '',
      createdBy: (req.admin || req.user)?._id,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: {
        coupon,
      },
    });
  } catch (error) {
    console.error('❌ Create coupon error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: 'Server error while creating coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all coupons
 * @route   GET /api/admin/coupons
 * @access  Private (Admin only)
 */
export const getAllCoupons = async (req, res) => {
  try {
    const {
      status,
      couponType,
      dateRange,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        query.isActive = true;
        query.validityEnd = { $gte: now };
        query.usedCount = { $lt: query.usageLimit || Infinity };
      } else if (status === 'expired') {
        query.$or = [
          { validityEnd: { $lt: now } },
          { isActive: false },
        ];
      } else if (status === 'used') {
        query.$expr = { $gte: ['$usedCount', '$usageLimit'] };
      }
    }

    // Coupon type filter
    if (couponType && couponType !== 'all') {
      query.discountType = couponType;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          query.createdAt = { $gte: startDate };
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.createdAt = { $gte: startDate };
          break;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get coupons
    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .populate('carId', 'brand model')
      .populate('carIds', 'brand model year pricePerDay')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        coupons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupons',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get single coupon by ID
 * @route   GET /api/admin/coupons/:id
 * @access  Private (Admin only)
 */
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('carId', 'brand model')
      .populate('carIds', 'brand model year pricePerDay')
      .populate('userId', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coupon,
      },
    });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin only)
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: updateData.code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists',
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate discount value if being updated
    if (updateData.discountType === 'percentage' && updateData.discountValue !== undefined) {
      if (updateData.discountValue < 0 || updateData.discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount must be between 0 and 100',
        });
      }
    }

    // Validate dates if being updated
    if (updateData.validityStart || updateData.validityEnd) {
      const startDate = updateData.validityStart ? new Date(updateData.validityStart) : coupon.validityStart;
      const endDate = updateData.validityEnd ? new Date(updateData.validityEnd) : coupon.validityEnd;
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'Validity end date must be after start date',
        });
      }
    }

    // Handle carIds if applicableTo is car_id
    if (updateData.applicableTo === 'car_id' || (updateData.applicableTo === undefined && coupon.applicableTo === 'car_id')) {
      const applicableTo = updateData.applicableTo || coupon.applicableTo;
      const carIdsArray = updateData.carIds && Array.isArray(updateData.carIds) 
        ? updateData.carIds 
        : (updateData.carId ? [updateData.carId] : (coupon.carIds && coupon.carIds.length > 0 ? coupon.carIds : []));
      
      if (carIdsArray.length === 0 && applicableTo === 'car_id') {
        return res.status(400).json({
          success: false,
          message: 'At least one car must be selected when applicableTo is car_id',
        });
      }

      // Verify all cars exist
      for (const id of carIdsArray) {
        const car = await Car.findById(id);
        if (!car) {
          return res.status(404).json({
            success: false,
            message: `Car with ID ${id} not found`,
          });
        }
      }

      // Update carIds and carId for backward compatibility
      updateData.carIds = carIdsArray;
      updateData.carId = carIdsArray.length === 1 ? carIdsArray[0] : null;
    }

    // Update coupon
    Object.assign(coupon, updateData);
    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: {
        coupon,
      },
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin only)
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    await Coupon.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Toggle coupon active status
 * @route   PATCH /api/admin/coupons/:id/toggle
 * @access  Private (Admin only)
 */
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        coupon,
      },
    });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling coupon status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get coupon usage statistics
 * @route   GET /api/admin/coupons/:id/usage
 * @access  Private (Admin only)
 */
export const getCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Get bookings that used this coupon
    const bookings = await Booking.find({ 'pricing.couponCode': coupon.code })
      .populate('user', 'name email phone')
      .populate('car', 'brand model')
      .select('bookingId user car pricing.finalPrice pricing.discount createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          usedCount: coupon.usedCount,
          usageLimit: coupon.usageLimit,
          remaining: coupon.usageLimit - coupon.usedCount,
        },
        usage: bookings.map((booking) => ({
          bookingId: booking.bookingId,
          userId: booking.user ? booking.user._id : null,
          userName: booking.user ? booking.user.name : 'Deleted User',
          userEmail: booking.user ? booking.user.email : 'N/A',
          carId: booking.car ? booking.car._id : null,
          carName: booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Deleted Car',
          discountApplied: booking.pricing?.discount || 0,
          finalPrice: booking.pricing?.finalPrice || 0,
          usedDate: booking.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get coupon usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Validate coupon (for users)
 * @route   POST /api/coupons/validate
 * @access  Private (User)
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code, amount, carId } = req.body;
    const userId = req.user._id;

    if (!code || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and amount are required',
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid booking amount greater than 0 is required to apply a coupon',
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    // Get car details if carId provided
    let carType = null;
    if (carId) {
      const car = await Car.findById(carId);
      if (car) {
        carType = car.carType;
      }
    }

    // Check if coupon can be applied
    const canApply = coupon.canBeApplied(amount, carId, userId, carType);
    if (!canApply.valid) {
      console.log('❌ Coupon validation failed:', {
        code: coupon.code,
        reason: canApply.message,
        isActive: coupon.isActive,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        validityStart: coupon.validityStart,
        validityEnd: coupon.validityEnd,
        now: new Date(),
        applicableTo: coupon.applicableTo,
        carIds: coupon.carIds,
        userId: coupon.userId,
        providedCarId: carId,
        providedUserId: userId,
      });
      return res.status(400).json({
        success: false,
        message: canApply.message,
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(amount);
    const finalAmount = amount - discount;

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
        },
        discountAmount: discount, // Also include as discountAmount for frontend compatibility
        discount, // Keep for backward compatibility
        originalAmount: amount,
        finalAmount: Math.max(0, finalAmount),
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

