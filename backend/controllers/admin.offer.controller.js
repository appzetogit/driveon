import Offer from '../models/Offer.js';
import Booking from '../models/Booking.js';

/**
 * @desc    Create a new offer
 * @route   POST /api/admin/offers
 * @access  Private (Admin only)
 */
export const createOffer = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      discountType,
      discountValue,
      isFirstTimeOnly,
      validityStart,
      validityEnd,
      isActive,
      validDays,
    } = req.body;

    // Validation
    if (!title || !code || !discountType || !validityStart || !validityEnd) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, code, discountType, validityStart, validityEnd',
      });
    }

    // Check unique code
    const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Offer code already exists',
      });
    }

    // Validate discount value
    let val = 0;
    if (discountType !== 'free') {
      val = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue;
      if (isNaN(val) || val < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount value must be a non-negative number',
        });
      }
      if (discountType === 'percentage' && val > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
    }

    // Validate dates
    const startDate = new Date(validityStart);
    const endDate = new Date(validityEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid validity dates provided',
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Validity end date must be after validity start date',
      });
    }

    const offer = await Offer.create({
      title,
      code: code.toUpperCase(),
      description: description || '',
      discountType,
      discountValue: discountType === 'free' ? 0 : val,
      isFirstTimeOnly: isFirstTimeOnly || false,
      validityStart: startDate,
      validityEnd: endDate,
      validDays: validDays || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: (req.admin || req.user)?._id,
    });


    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (error) {
    console.error('❌ Create offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating offer',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all offers
 * @route   GET /api/admin/offers
 * @access  Private (Admin only)
 */
export const getAllOffers = async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        query.isActive = true;
        query.validityEnd = { $gte: now };
      } else if (status === 'expired') {
        query.$or = [
          { validityEnd: { $lt: now } },
          { isActive: false },
        ];
      }
    }

    // Type filter
    if (type && type !== 'all') {
      query.discountType = type;
    }

    const offers = await Offer.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Get all offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching offers',
    });
  }
};

/**
 * @desc    Get single offer by ID
 * @route   GET /api/admin/offers/:id
 * @access  Private (Admin only)
 */
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('createdBy', 'name email');
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Get offer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching offer',
    });
  }
};

/**
 * @desc    Update offer
 * @route   PUT /api/admin/offers/:id
 * @access  Private (Admin only)
 */
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // Check unique code if updated
    if (updateData.code && updateData.code.toUpperCase() !== offer.code) {
      const existingOffer = await Offer.findOne({ code: updateData.code.toUpperCase() });
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Offer code already exists',
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate discount value
    if (updateData.discountType !== undefined || updateData.discountValue !== undefined) {
      const type = updateData.discountType !== undefined ? updateData.discountType : offer.discountType;
      if (type !== 'free') {
        const val = updateData.discountValue !== undefined ? parseFloat(updateData.discountValue) : offer.discountValue;
        if (isNaN(val) || val < 0) {
          return res.status(400).json({
            success: false,
            message: 'Discount value must be a non-negative number',
          });
        }
        if (type === 'percentage' && val > 100) {
          return res.status(400).json({
            success: false,
            message: 'Percentage discount cannot exceed 100%',
          });
        }
        updateData.discountValue = val;
      } else {
        updateData.discountValue = 0;
      }
    }

    // Validate dates
    if (updateData.validityStart || updateData.validityEnd) {
      const start = updateData.validityStart ? new Date(updateData.validityStart) : offer.validityStart;
      const end = updateData.validityEnd ? new Date(updateData.validityEnd) : offer.validityEnd;
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'Validity end date must be after validity start date',
        });
      }
    }

    Object.assign(offer, updateData);
    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data: offer,
    });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating offer',
    });
  }
};

/**
 * @desc    Delete offer
 * @route   DELETE /api/admin/offers/:id
 * @access  Private (Admin only)
 */
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting offer',
    });
  }
};

/**
 * @desc    Toggle offer active status
 * @route   PATCH /api/admin/offers/:id/toggle
 * @access  Private (Admin only)
 */
export const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: offer,
    });
  } catch (error) {
    console.error('Toggle offer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling offer status',
    });
  }
};

/**
 * @desc    Get active offers for user booking flow (carousel)
 * @route   GET /api/offers/active
 * @access  Private (User authenticated)
 */
export const getActiveOffers = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Check user booking history to determine if they are a first-time user
    const bookingsCount = await Booking.countDocuments({
      user: userId,
      status: { $ne: 'cancelled' },
    });
    const isFirstTime = bookingsCount === 0;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = daysOfWeek[now.getDay()];

    const query = {
      isActive: true,
      validityStart: { $lte: now },
      validityEnd: { $gte: now },
      $or: [
        { validDays: { $exists: false } },
        { validDays: { $size: 0 } },
        { validDays: currentDay },
      ],
    };

    // If NOT a first time user, filter out first-time-only offers
    if (!isFirstTime) {
      query.isFirstTimeOnly = false;
    }

    const offers = await Offer.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Get active offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active offers',
    });
  }
};

/**
 * @desc    Validate offer code and calculate discount
 * @route   POST /api/offers/validate
 * @access  Private (User authenticated)
 */
export const validateOffer = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const userId = req.user._id;

    if (!code || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Offer code and booking amount are required',
      });
    }

    const offer = await Offer.findOne({ code: code.toUpperCase(), isActive: true });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive offer code',
      });
    }

    const now = new Date();
    if (now < offer.validityStart) {
      return res.status(400).json({
        success: false,
        message: 'This offer is not yet valid',
      });
    }
    if (now > offer.validityEnd) {
      return res.status(400).json({
        success: false,
        message: 'This offer has expired',
      });
    }

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


    // Check first-time-only logic
    if (offer.isFirstTimeOnly) {
      const bookingsCount = await Booking.countDocuments({
        user: userId,
        status: { $ne: 'cancelled' },
      });
      if (bookingsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'This offer is only valid for first time users',
        });
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = (amount * offer.discountValue) / 100;
    } else if (offer.discountType === 'fixed') {
      discount = offer.discountValue;
    } else if (offer.discountType === 'free') {
      discount = amount;
    }

    // Cap the discount
    discount = Math.round(discount * 100) / 100;
    discount = Math.min(discount, amount);

    res.status(200).json({
      success: true,
      message: 'Offer applied successfully',
      data: {
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount: discount,
        originalAmount: amount,
        finalAmount: Math.max(0, amount - discount),
      },
    });
  } catch (error) {
    console.error('Validate offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating offer',
    });
  }
};
