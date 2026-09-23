import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Car from '../models/Car.js';
import Booking from '../models/Booking.js';
import Setting from '../models/Setting.js';
import OutwardCar from '../models/OutwardCar.js';
import OutwardBooking from '../models/OutwardBooking.js';
import Offer from '../models/Offer.js';
import Coupon from '../models/Coupon.js';
import AddOnServices from '../models/AddOnServices.js';
import GuarantorPoints from '../models/GuarantorPoints.js';
import mongoose from 'mongoose';
import { generateAdminTokenPair, verifyAdminRefreshToken } from '../utils/adminJwtUtils.js';
import { sendPushNotification, sendPushToToken, sendStaffPushNotification } from '../services/firebase.service.js';
import Staff from '../models/Staff.js';
import Notification from '../models/Notification.js';
import { uploadImage } from '../services/cloudinary.service.js';

/**
 * Format user ID to USER001 format (same as frontend)
 * Takes MongoDB ObjectId and converts to USER + padded number
 */
const formatUserId = (userId) => {
  if (!userId) return '';
  const idStr = userId.toString();
  return `user-${idStr.slice(-5)}`;
};

/**
 * @desc    Admin Signup
 * @route   POST /api/admin/signup
 * @access  Public
 */
export const adminSignup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      phone: phone?.trim() || undefined,
      role: 'admin',
      isActive: true,
      permissions: [
        'users.manage',
        'users.view',
        'cars.manage',
        'cars.view',
        'bookings.manage',
        'bookings.view',
        'payments.manage',
        'payments.view',
        'kyc.manage',
        'kyc.view',
        'reports.view',
        'settings.manage',
      ],
    });

    // Generate tokens (access token with 24h expiry, refresh token with 7d expiry)
    const tokens = generateAdminTokenPair(admin._id.toString());

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Admin Login
 * @route   POST /api/admin/login
 * @access  Public
 */
export const adminLogin = async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('✅✅✅ ADMIN LOGIN CONTROLLER CALLED');
    console.log('✅✅✅ NO MIDDLEWARE APPLIED - Direct route match');
    console.log('Route:', req.method, req.originalUrl);
    console.log('Path:', req.path);
    console.log('Body:', { email: req.body?.email, hasPassword: !!req.body?.password });
    console.log('Headers:', { hasAuth: !!req.headers.authorization });
    console.log('========================================\n');

    const { email, password, fcmToken, platform } = req.body;

    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('🔍 Looking for admin with email:', email.toLowerCase().trim());

    // Find admin with password field
    const admin = await Admin.findOne({
      email: email.toLowerCase().trim()
    }).select('+password'); // Include password field

    if (!admin) {
      console.log('❌ Admin not found for email:', email.toLowerCase().trim());
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Admin found:', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      isActive: admin.isActive,
    });

    // Check if admin is active
    if (!admin.isActive) {
      console.log('❌ Admin account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated. Please contact support.'
      });
    }

    // Compare password
    console.log('🔐 Comparing password...');
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password is valid');

    // Update last login
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    admin.lastLogin = new Date();
    admin.lastLoginIP = clientIP;

    // Save FCM Token if present
    if (fcmToken) {
      if (platform === 'mobile') {
        admin.fcmTokenMobile = fcmToken;
      } else {
        admin.fcmToken = fcmToken;
      }
      console.log(`✅ Admin FCM Token updated for ${admin.name} [${platform || 'web'}]`);
    }

    await admin.save({ validateBeforeSave: false }); // One save call for both lastLogin and FCM

    // Generate tokens (access token with 24h expiry, refresh token with 7d expiry)
    const tokens = generateAdminTokenPair(admin._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Refresh Admin Token
 * @route   POST /api/admin/refresh-token
 * @access  Public
 */
export const refreshAdminToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyAdminRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find admin
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Generate new token pair
    const tokens = generateAdminTokenPair(admin._id.toString());

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    console.error('Admin refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Admin Profile
 * @route   GET /api/admin/profile
 * @access  Private (Admin)
 */
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          profilePhoto: admin.profilePhoto,
          phone: admin.phone,
          department: admin.department,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Admin Logout
 * @route   POST /api/admin/logout
 * @access  Private (Admin)
 */
export const adminLogout = async (req, res) => {
  try {
    // In a more advanced implementation, you could blacklist the token here
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get All Users (Admin)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('✅ GET ALL USERS - Admin Controller');
    console.log('Admin:', req.user?.email);
    console.log('Query params:', req.query);
    console.log('========================================\n');

    const {
      page = 1,
      limit = 1000, // Default to get all users
      search = '',
      accountStatus,
      kycStatus,
      profileCompletion,
      userType,
    } = req.query;

    // Build query
    const query = {};
    const orConditions = [];

    // Search filter
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      // Handle special "user-XXXXX" search format
      if (/^user-?[0-9a-fA-F]{1,5}$/i.test(trimmedSearch)) {
        const match = trimmedSearch.match(/^user-?([0-9a-fA-F]+)$/i);
        if (match) {
          const suffix = match[1].toLowerCase();
          // We'll use a regex that matches ObjectIds ending with this suffix
          // Mongo ObjectIds are 24 chars, so we need 19 wildcard chars (or less) then the suffix
          const idRegex = new RegExp(`.*${suffix}$`, 'i');
          orConditions.push({ _id: { $regex: idRegex } });
        }
      } else {
        const keywords = trimmedSearch.split(/\s+/).filter(Boolean);
        if (keywords.length > 0) {
          const keywordConditions = keywords.map(keyword => {
            const regex = { $regex: keyword, $options: 'i' };
            return {
              $or: [
                { name: regex },
                { email: regex },
                { phone: regex }
              ]
            };
          });
          query.$and = query.$and ? [...query.$and, ...keywordConditions] : keywordConditions;
        }
      }
    }

    // Account status filter (only if not 'all')
    if (accountStatus && accountStatus !== 'all') {
      query.accountStatus = accountStatus;
    }

    // KYC status filter (based on isPhoneVerified and isEmailVerified)
    if (kycStatus && kycStatus !== 'all') {
      if (kycStatus === 'verified') {
        query.isPhoneVerified = true;
        query.isEmailVerified = true;
      } else if (kycStatus === 'pending') {
        // Use $and to ensure at least one is false
        query.$and = [
          {
            $or: [
              { isPhoneVerified: false },
              { isEmailVerified: false },
            ],
          },
        ];
      }
    }

    // User type filter (only if not 'all')
    if (userType && userType !== 'all') {
      query.role = userType;
    }

    // Combine search conditions with query
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ Found ${users.length} users`);

    // Get total count
    const total = await User.countDocuments(query);

    // Calculate profile completion for each user
    const usersWithCompletion = users.map(user => {
      const userObj = user.toObject();

      // Add id field for frontend compatibility
      userObj.id = userObj._id;

      // Calculate KYC status
      if (userObj.isPhoneVerified && userObj.isEmailVerified) {
        userObj.kycStatus = 'verified';
      } else {
        userObj.kycStatus = 'pending';
      }

      // Ensure accountStatus has a default value
      if (!userObj.accountStatus) {
        userObj.accountStatus = 'active';
      }

      // Calculate profile completion
      const fields = ['name', 'email', 'phone', 'age', 'gender', 'address', 'profilePhoto'];
      let completedFields = 0;

      fields.forEach(field => {
        if (userObj[field] !== undefined && userObj[field] !== null && userObj[field] !== '') {
          completedFields++;
        }
      });

      userObj.profileCompletion = Math.round((completedFields / fields.length) * 100);
      return userObj;
    });

    // Filter by profile completion if specified
    let filteredUsers = usersWithCompletion;
    if (profileCompletion && profileCompletion !== 'all') {
      const completionValue = parseInt(profileCompletion);
      filteredUsers = usersWithCompletion.filter(user => user.profileCompletion >= completionValue);
    }

    console.log(`✅ Returning ${filteredUsers.length} filtered users\n`);

    res.status(200).json({
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update Admin Profile
 * @route   PUT /api/admin/profile
 * @access  Private (Admin)
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      admin.name = name.trim();
    }
    if (phone !== undefined) {
      admin.phone = phone?.trim() || undefined;
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          profilePhoto: admin.profilePhoto,
          department: admin.department,
        },
      },
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Change Admin Password
 * @route   PUT /api/admin/change-password
 * @access  Private (Admin)
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin with password field
    const admin = await Admin.findById(req.user._id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Dashboard Statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const selectedYear = parseInt(req.query.year) || new Date().getFullYear();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalCars,
      activeCars,
      pendingKYCCountRaw,
      pendingKYCCountFallback,
      activeBookings,
      totalBookings,
      bookingsWithTodayTxns,
      bookingsTodayFallback,
      activeTrips,
      totalActiveUsers,
      totalPendingCars,
      totalSuspendedCars,
      totalOutwardCars,
      pendingBookings,
      totalInwardBookings,
      totalOutwardBookings,
      activeOffers,
      activeCoupons,
      totalAddonServices,
      recentBookingsList,
      pendingKYCListRaw,
      pendingKYCListFallback,
      bookingsWithTxns,
      bookingsWithPaidAmountFallback,
      monthlyBookings,
      yearlyBookings,
      standardRevenue,
      outwardRevenue,
      dbCars,
      outwardCars,
      monthlyInwardBookings,
      yearlyInwardBookings
    ] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Car.countDocuments({ status: 'active' }),
      User.countDocuments({
        isKYCVerified: false,
        $or: [
          { 'kycDetails.aadhaar.number': { $exists: true, $ne: '' } },
          { 'kycDetails.pan.number': { $exists: true, $ne: '' } },
          { 'kycDetails.dl.number': { $exists: true, $ne: '' } },
          { rcDocument: { $exists: true, $ne: '' } }
        ]
      }),
      User.countDocuments({
        $or: [
          { isPhoneVerified: false },
          { isEmailVerified: false },
          { isKYCVerified: false }
        ]
      }),
      Booking.countDocuments({
        status: { $in: ['confirmed', 'active'] }
      }),
      Booking.countDocuments({
        createdAt: {
          $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
          $lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`)
        },
        status: { $ne: 'unpaid' },
        $or: [
          { status: { $ne: 'cancelled' } },
          { paidAmount: { $gt: 0 } },
          { paymentStatus: { $in: ['paid', 'partial', 'refunded'] } }
        ]
      }),
      Booking.find({
        'transactions.status': 'success',
        'transactions.paymentDate': { $gte: startOfToday, $lte: endOfToday }
      }),
      Booking.find({
        createdAt: { $gte: startOfToday, $lte: endOfToday },
        status: { $ne: 'unpaid' },
        paidAmount: { $gt: 0 }
      }),
      Booking.countDocuments({
        $or: [
          { status: { $in: ['confirmed', 'active'] } },
          { tripStatus: { $in: ['started', 'in_progress'] } }
        ]
      }),
      User.countDocuments({
        isActive: true,
        accountStatus: 'active',
      }),
      Car.countDocuments({ status: 'pending' }),
      Car.countDocuments({ status: 'suspended' }),
      OutwardCar.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      OutwardBooking.countDocuments({ carType: 'inward' }),
      OutwardBooking.countDocuments({ $or: [{ carType: 'outward' }, { carType: { $exists: false } }] }),
      Offer.countDocuments({ isActive: true }),
      Coupon.countDocuments({ isActive: true }),
      AddOnServices.countDocuments(),
      Booking.find({
        status: { $ne: 'unpaid' },
        $or: [
          { status: { $ne: 'cancelled' } },
          { paidAmount: { $gt: 0 } },
          { paymentStatus: { $in: ['paid', 'partial', 'refunded'] } }
        ]
      })
        .populate('user', 'name phone email')
        .populate('car', 'brand model year')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({
        isKYCVerified: false,
        $or: [
          { 'kycDetails.aadhaar.number': { $exists: true, $ne: '' } },
          { 'kycDetails.pan.number': { $exists: true, $ne: '' } },
          { 'kycDetails.dl.number': { $exists: true, $ne: '' } },
          { rcDocument: { $exists: true, $ne: '' } }
        ]
      })
        .sort({ updatedAt: -1 })
        .limit(5),
      User.find({ isKYCVerified: false })
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find({
        'transactions.status': 'success'
      })
        .populate('user', 'name phone email')
        .sort({ 'transactions.paymentDate': -1 })
        .limit(10),
      Booking.find({
        paidAmount: { $gt: 0 },
        status: { $ne: 'unpaid' }
      })
        .populate('user', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
              $lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`)
            },
            status: { $ne: 'unpaid' },
            $or: [
              { status: { $ne: 'cancelled' } },
              { paidAmount: { $gt: 0 } },
              { paymentStatus: { $in: ['paid', 'partial', 'refunded'] } }
            ]
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            bookings: { $sum: 1 },
            revenue: { $sum: '$paidAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        {
          $match: {
            status: { $ne: 'unpaid' },
            $or: [
              { status: { $ne: 'cancelled' } },
              { paidAmount: { $gt: 0 } },
              { paymentStatus: { $in: ['paid', 'partial', 'refunded'] } }
            ]
          }
        },
        {
          $group: {
            _id: { $year: '$createdAt' },
            bookings: { $sum: 1 },
            revenue: { $sum: '$paidAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'partial'] } } },
        {
          $group: {
            _id: '$car',
            revenue: { $sum: { $ifNull: ['$paidAmount', 0] } }
          }
        }
      ]),
      OutwardBooking.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'partial'] } } },
        {
          $group: {
            _id: '$carId',
            revenue: { $sum: { $ifNull: ['$paidAmount', 0] } }
          }
        }
      ]),
      Car.find({}),
      mongoose.connection.db.collection('outwardcars').find({}).toArray(),
      OutwardBooking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
              $lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`)
            },
            carType: 'inward'
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            inwardBookings: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      OutwardBooking.aggregate([
        {
          $match: {
            carType: 'inward'
          }
        },
        {
          $group: {
            _id: { $year: '$createdAt' },
            inwardBookings: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // 1. Process Pending KYC Count
    const pendingKYC = pendingKYCCountRaw > 0 ? pendingKYCCountRaw : pendingKYCCountFallback;

    // 2. Process Today's Revenue
    let todayRevenue = 0;
    bookingsWithTodayTxns.forEach(booking => {
      booking.transactions.forEach(txn => {
        if (txn.status === 'success' && txn.paymentDate >= startOfToday && txn.paymentDate <= endOfToday) {
          todayRevenue += txn.amount || 0;
        }
      });
    });

    if (todayRevenue === 0) {
      todayRevenue = bookingsTodayFallback.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    }

    // Helper functions for formatting
    const formatUserId = (id) => {
      if (!id) return '';
      const str = id.toString();
      return str.length > 8 ? `...${str.substring(str.length - 8)}` : str;
    };

    // 3. Process Recent Bookings List
    const recentBookings = recentBookingsList.map(b => ({
      id: b._id,
      userId: b.user ? (b.user.name || formatUserId(b.user._id)) : 'Unknown',
      car: b.car ? `${b.car.brand} ${b.car.model}` : 'N/A',
      time: new Date(b.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      amount: b.paidAmount || b.pricing?.totalPrice || 0,
      status: b.status === 'confirmed' ? 'confirmed' : b.status === 'active' ? 'active' : b.status
    }));

    // 4. Process Pending KYC List
    const kycList = pendingKYCListRaw.length > 0 ? pendingKYCListRaw : pendingKYCListFallback;
    const pendingKYCData = kycList.map(u => {
      const docs = [];
      if (u.kycDetails?.aadhaar?.number) docs.push('Aadhaar');
      if (u.kycDetails?.pan?.number) docs.push('PAN');
      if (u.kycDetails?.dl?.number) docs.push('DL');
      if (u.rcDocument) docs.push('RC');
      const documentType = docs.length > 0 ? docs.join('/') : 'Email/Phone';

      return {
        id: u._id,
        userId: u.name || formatUserId(u._id),
        documentType,
        time: new Date(u.updatedAt || u.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    });

    // 5. Process Recent Payments List
    const recentPaymentsList = [];
    bookingsWithTxns.forEach(b => {
      b.transactions.forEach(txn => {
        if (txn.status === 'success') {
          recentPaymentsList.push({
            id: txn._id || txn.transactionId || b._id,
            bookingId: b.bookingId || b._id.toString(),
            userId: b.user ? (b.user.name || formatUserId(b.user._id)) : 'Unknown',
            amount: txn.amount || 0,
            status: b.paymentStatus === 'partial' ? 'Advance Done' : 'success',
            time: new Date(txn.paymentDate || b.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            paymentDate: txn.paymentDate || b.createdAt
          });
        }
      });
    });

    recentPaymentsList.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    let recentPayments = recentPaymentsList.slice(0, 5);

    if (recentPayments.length === 0) {
      bookingsWithPaidAmountFallback.forEach(b => {
        recentPayments.push({
          id: b._id,
          bookingId: b.bookingId || b._id.toString(),
          userId: b.user ? (b.user.name || formatUserId(b.user._id)) : 'Unknown',
          amount: b.paidAmount || 0,
          status: b.paymentStatus === 'partial' ? 'Advance Done' : 'success',
          time: new Date(b.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
      });
    }

    // 6. Process Monthly Booking Trends
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const dbData = monthlyBookings.find(item => item._id === monthNum);
      const inwardData = monthlyInwardBookings.find(item => item._id === monthNum);
      return {
        name,
        bookings: dbData ? dbData.bookings : 0,
        inwardBookings: inwardData ? inwardData.inwardBookings : 0,
        revenue: dbData ? dbData.revenue : 0
      };
    });

    // 7. Process Yearly Booking Trends
    const recentYears = [2022, 2023, 2024, 2025, 2026];
    const formattedYearlyData = recentYears.map(yr => {
      const dbData = yearlyBookings.find(item => item._id === yr);
      const inwardData = yearlyInwardBookings.find(item => item._id === yr);
      return {
        name: yr.toString(),
        bookings: dbData ? dbData.bookings : 0,
        inwardBookings: inwardData ? inwardData.inwardBookings : 0,
        revenue: dbData ? dbData.revenue : 0
      };
    });

    // 8. Process Top 5 Cars by Revenue
    let topCars = [];
    try {
      const carMap = {};

      dbCars.forEach(c => {
        const info = {
          name: `${c.brand} ${c.model}`,
          registrationNumber: c.registrationNumber,
          source: c.source || 'inward',
          revenue: 0
        };
        carMap[c._id.toString()] = info;
        if (c.outwardCarId) {
          carMap[c.outwardCarId] = info;
        }
      });

      outwardCars.forEach(oc => {
        const idStr = (oc.originalOutputId || oc._id).toString();
        if (!carMap[idStr]) {
          carMap[idStr] = {
            name: `${oc.brand || ''} ${oc.model || ''}`.trim() || oc.name || 'Outward Car',
            registrationNumber: oc.carNumber || oc.registrationNumber || '',
            source: 'outward',
            revenue: 0
          };
        }
      });

      standardRevenue.forEach(stat => {
        if (stat._id) {
          const idStr = stat._id.toString();
          if (carMap[idStr]) {
            carMap[idStr].revenue += stat.revenue;
          }
        }
      });

      outwardRevenue.forEach(stat => {
        if (stat._id) {
          const idStr = stat._id.toString();
          if (carMap[idStr]) {
            carMap[idStr].revenue += stat.revenue;
          }
        }
      });

      const uniqueCarsList = Array.from(new Set(Object.values(carMap)));
      uniqueCarsList.sort((a, b) => b.revenue - a.revenue);
      topCars = uniqueCarsList.slice(0, 5).map(c => ({
        name: c.name,
        registrationNumber: c.registrationNumber,
        source: c.source,
        revenue: c.revenue
      }));
    } catch (err) {
      console.error('Error computing top cars for dashboard:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCars,
          activeCars,
          activeBookings,
          totalBookings,
          pendingKYC,
          todayRevenue,
          activeTrips,
          totalActiveUsers,
          totalPendingCars,
          totalSuspendedCars,
          totalOutwardCars,
          pendingBookings,
          totalInwardBookings,
          totalOutwardBookings,
          activeOffers,
          activeCoupons,
          totalAddonServices,
        },
        recentBookings,
        pendingKYC: pendingKYCData,
        recentPayments,
        bookingTrends: {
          monthly: formattedMonthlyData,
          yearly: formattedYearlyData
        },
        topCars
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get System Settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
export const getSystemSettings = async (req, res) => {
  try {
    const dbSettings = await Setting.find({});
    
    const settingsObj = {};
    dbSettings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    const settings = {
      appName: settingsObj.appName || process.env.APP_NAME || 'DriveOn',
      contactEmail: settingsObj.contactEmail || process.env.CONTACT_EMAIL || 'driveon721@gmail.com',
      contactPhone: settingsObj.contactPhone || process.env.CONTACT_PHONE || '+91 98765 43210',
      advancePaymentPercentage: settingsObj.advancePaymentPercentage !== undefined ? Number(settingsObj.advancePaymentPercentage) : 20,
      cashCollectors: settingsObj.cashCollectors || [],
    };

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update System Settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
export const updateSystemSettings = async (req, res) => {
  try {
    const { appName, contactEmail, contactPhone, advancePaymentPercentage, cashCollectors } = req.body;

    // Validation
    if (!appName || !contactEmail || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'App name, contact email, and contact phone are required'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const percentage = advancePaymentPercentage !== undefined ? Number(advancePaymentPercentage) : 20;
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Advance payment percentage must be a number between 0 and 100'
      });
    }

    const collectorsList = Array.isArray(cashCollectors) ? cashCollectors : [];

    const settingsToSave = [
      { key: 'appName', value: appName.trim() },
      { key: 'contactEmail', value: contactEmail.trim().toLowerCase() },
      { key: 'contactPhone', value: contactPhone.trim() },
      { key: 'advancePaymentPercentage', value: percentage },
      { key: 'cashCollectors', value: collectorsList }
    ];

    for (const s of settingsToSave) {
      await Setting.findOneAndUpdate(
        { key: s.key },
        { value: s.value },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        settings: {
          appName: appName.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim(),
          advancePaymentPercentage: percentage,
          cashCollectors: collectorsList,
        },
      },
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get User by ID (Admin)
 * @route   GET /api/admin/users/:userId
 * @access  Private (Admin)
 * @note    Supports MongoDB ObjectId, phone number, email, or custom user ID format
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const trimmedId = userId.trim();
    let user = null;

    // 0. Handle "user-XXXX" or "user-XXXXX" format (e.g., "user-255f6")
    // This format uses the last 5 hex characters of the MongoDB ObjectId
    // Extract the 5-character suffix and search for users whose ObjectId ends with it
    if (/^user-?[0-9a-fA-F]{1,5}$/i.test(trimmedId)) {
      try {
        const match = trimmedId.match(/^user-?([0-9a-fA-F]+)$/i);
        if (match) {
          const suffix = match[1].toLowerCase();

          // If suffix is less than 5 characters, pad it (though typically it should be 5)
          // If more than 5, take last 5
          const searchSuffix = suffix.length > 5
            ? suffix.slice(-5)
            : suffix.padStart(5, '0');

          console.log(`🔍 Searching for user with ObjectId ending in: ${searchSuffix} from input: ${trimmedId}`);

          // Search for users whose ObjectId ends with the extracted suffix
          // MongoDB ObjectId is 24 hex characters, so we search by the last 5
          const allUsers = await User.find().select('-password -__v');
          user = allUsers.find((u) => {
            const userId = u._id.toString().toLowerCase();
            return userId.endsWith(searchSuffix);
          }) || null;

          if (user) {
            console.log(`✅ Found user with ObjectId ending in: ${searchSuffix}`);
          } else {
            console.log(`❌ No user found with ObjectId ending in: ${searchSuffix}`);
          }
        }
      } catch (formattedError) {
        console.log('Formatted USER ID search failed:', formattedError.message);
      }
    }

    // 0.5. If ID is in formatted form (e.g. USER001), try to resolve it
    if (!user && /^USER\d{3}$/i.test(trimmedId)) {
      try {
        const allUsers = await User.find().select('-password -__v');
        const upperId = trimmedId.toUpperCase();

        user = allUsers.find((u) => formatUserId(u._id) === upperId) || null;
      } catch (formattedError) {
        console.log('Formatted USER ID search failed:', formattedError.message);
      }
    }

    // 1. Check if it's a valid MongoDB ObjectId format (24 hex characters)
    if (!user) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(trimmedId);

      if (isValidObjectId) {
        // Try to find by MongoDB _id first
        try {
          user = await User.findById(trimmedId).select('-password -__v');
        } catch (findError) {
          // If findById fails, continue to other search methods
          console.log('findById failed, trying other search methods:', findError.message);
        }
      }
    }

    // 2. If not found by _id or formatted ID, try searching by phone number
    if (!user) {
      try {
        // Check if it looks like a phone number (10 digits)
        if (/^[6-9]\d{9}$/.test(trimmedId)) {
          user = await User.findOne({ phone: trimmedId }).select('-password -__v');
        }
      } catch (phoneError) {
        console.log('Phone search failed:', phoneError.message);
      }
    }

    // 3. If not found, try searching by email
    if (!user) {
      try {
        // Check if it looks like an email
        if (trimmedId.includes('@')) {
          user = await User.findOne({ email: trimmedId.toLowerCase() }).select('-password -__v');
        }
      } catch (emailError) {
        console.log('Email search failed:', emailError.message);
      }
    }

    // 4. If not found, try searching by referralCode or guarantorId (custom IDs)
    if (!user) {
      try {
        user = await User.findOne({
          $or: [
            { referralCode: trimmedId },
            { guarantorId: trimmedId },
          ]
        }).select('-password -__v');
      } catch (customError) {
        console.log('Custom ID search failed:', customError.message);
      }
    }

    // 5. If still not found, try partial match on phone or email or name
    if (!user) {
      try {
        user = await User.findOne({
          $or: [
            { phone: { $regex: trimmedId, $options: 'i' } },
            { email: { $regex: trimmedId, $options: 'i' } },
            { name: { $regex: trimmedId, $options: 'i' } },
          ]
        }).select('-password -__v');
      } catch (partialError) {
        console.log('Partial search failed:', partialError.message);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate profile completion
    const fields = ['name', 'email', 'phone', 'age', 'gender', 'address', 'profilePhoto'];
    let completedFields = 0;

    fields.forEach(field => {
      if (user[field] !== undefined && user[field] !== null && user[field] !== '') {
        completedFields++;
      }
    });

    const profileCompletion = Math.round((completedFields / fields.length) * 100);

    // Calculate KYC status
    let kycStatus = 'pending';
    if (user.isPhoneVerified && user.isEmailVerified) {
      kycStatus = 'verified';
    }

    const userObj = user.toObject();
    userObj.id = userObj._id; // Add id field for frontend compatibility
    if (!userObj.accountStatus) {
      userObj.accountStatus = 'active';
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...userObj,
          profileCompletion,
          kycStatus,
        },
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request params:', req.params);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update User Status (Admin)
 * @route   PUT /api/admin/users/:userId/status
 * @access  Private (Admin)
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'activate', 'suspend', or 'ban'

    if (!['activate', 'suspend', 'ban'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: activate, suspend, or ban'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    if (action === 'activate') {
      user.isActive = true;
      user.accountStatus = 'active';
    } else if (action === 'suspend') {
      user.isActive = false;
      user.accountStatus = 'suspended';
    } else if (action === 'ban') {
      user.isActive = false;
      user.accountStatus = 'banned';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          accountStatus: user.accountStatus,
        },
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete User (Admin)
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user from DB
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully from database'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


/**
 * @desc    Get All Referrals (Admin)
 * @route   GET /api/admin/referrals
 * @access  Private (Admin)
 */
export const getAllReferrals = async (req, res) => {
  try {
    const { status, dateRange, referrer, search } = req.query;

    // Get all users who have been referred (have referredBy field)
    const referredUsers = await User.find({ referredBy: { $exists: true, $ne: null } })
      .populate('referredBy', 'name email referralCode')
      .select('name email createdAt referredBy points totalPointsEarned totalPointsUsed referralPointsAdjustment')
      .sort({ createdAt: -1 });

    // Transform to referral format
    const referrals = await Promise.all(
      referredUsers.map(async (referredUser) => {
        const referrer = referredUser.referredBy;

        // Count completed trips for the referred user
        const tripsCompleted = await Booking.countDocuments({
          user: referredUser._id,
          status: 'completed',
        });

        // Calculate points earned (50 for signup + 50 for first completed trip + admin adjustment)
        let pointsEarned = 50 + (referredUser.referralPointsAdjustment || 0); // Signup points + adjustment
        if (tripsCompleted > 0) {
          pointsEarned += 50; // First trip completion points
        }

        // Determine status: completed if has completed trips, pending otherwise
        const referralStatus = tripsCompleted > 0 ? 'completed' : 'pending';

        // Get redemption history (points used)
        const redemptionHistory = [];
        // Note: In a real system, you might want to track individual redemptions
        // For now, we'll use totalPointsUsed as a proxy
        if (referredUser.totalPointsUsed > 0) {
          redemptionHistory.push({
            date: new Date().toISOString(), // You might want to track actual redemption dates
            points: referredUser.totalPointsUsed,
            description: 'Points redeemed',
          });
        }

        return {
          id: referredUser._id.toString(),
          referrerId: referrer?._id?.toString() || '',
          referrerName: referrer?.name || referrer?.email?.split('@')[0] || 'Unknown',
          referrerEmail: referrer?.email || '',
          referralCode: referrer?.referralCode || '',
          referredUserId: referredUser._id.toString(),
          referredUserName: referredUser.name || referredUser.email.split('@')[0],
          referredUserEmail: referredUser.email,
          pointsEarned,
          status: referralStatus,
          referralDate: referredUser.createdAt,
          completedDate: tripsCompleted > 0 ? referredUser.createdAt : null,
          redemptionHistory,
        };
      })
    );

    // Apply filters
    let filteredReferrals = referrals;

    // Status filter
    if (status && status !== 'all') {
      filteredReferrals = filteredReferrals.filter((r) => r.status === status);
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      filteredReferrals = filteredReferrals.filter((referral) => {
        const referralDate = new Date(referral.referralDate);
        switch (dateRange) {
          case 'today':
            return referralDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return referralDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return referralDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Referrer filter
    if (referrer && referrer !== 'all') {
      filteredReferrals = filteredReferrals.filter((r) => r.referrerId === referrer);
    }

    // Search filter
    if (search && search.trim() !== '') {
      const query = search.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filteredReferrals = filteredReferrals.filter((referral) => {
        const referrerName = (referral.referrerName || '').toLowerCase();
        const referrerEmail = (referral.referrerEmail || '').toLowerCase();
        const referredUserName = (referral.referredUserName || '').toLowerCase();
        const referredUserEmail = (referral.referredUserEmail || '').toLowerCase();
        const referralCode = (referral.referralCode || '').toLowerCase();

        return keywords.every((keyword) =>
          referrerName.includes(keyword) ||
          referrerEmail.includes(keyword) ||
          referredUserName.includes(keyword) ||
          referredUserEmail.includes(keyword) ||
          referralCode.includes(keyword)
        );
      });
    }

    res.status(200).json({
      success: true,
      data: {
        referrals: filteredReferrals,
        total: filteredReferrals.length,
      },
    });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching referrals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update Referral Points (Admin)
 * @route   PUT /api/admin/referrals/:referralId/points
 * @access  Private (Admin)
 */
export const updateReferralPoints = async (req, res) => {
  try {
    const { referralId } = req.params;
    const { points } = req.body; // Points to add (can be negative to subtract)

    if (typeof points !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Points must be a number',
      });
    }

    // Find the referred user
    const referredUser = await User.findById(referralId);
    if (!referredUser) {
      return res.status(404).json({
        success: false,
        message: 'Referred user not found',
      });
    }

    // Update points adjustment on referred user
    referredUser.referralPointsAdjustment = (referredUser.referralPointsAdjustment || 0) + points;
    await referredUser.save();

    // Fetch the referrer using referredUser.referredBy
    let referrerNewPoints = 0;
    let referrerNewTotal = 0;
    const referrer = await User.findById(referredUser.referredBy);
    if (referrer) {
      referrer.points = Math.max(0, (referrer.points || 0) + points);
      if (points > 0) {
        referrer.totalPointsEarned = (referrer.totalPointsEarned || 0) + points;
      }
      await referrer.save();
      referrerNewPoints = referrer.points;
      referrerNewTotal = referrer.totalPointsEarned;
    }

    res.status(200).json({
      success: true,
      message: 'Points updated successfully',
      data: {
        referral: {
          id: referredUser._id.toString(),
          points: referrerNewPoints,
          totalPointsEarned: referrerNewTotal,
        },
      },
    });
  } catch (error) {
    console.error('Update referral points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating referral points',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Send manual push notification
 * @route   POST /api/admin/send-notification
 * @access  Private (Admin)
 */
// export const sendNotification = async (req, res) => {
//   try {
//     const { userId, token, title, body, data = {}, platform = 'web' } = req.body;

//     if (!title || !body) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title and body are required',
//       });
//     }

//     let response;

//     if (token) {
//       // Send directly to the provided token
//       console.log('📣 Sending notification to provided token...');
//       response = await sendPushToToken(token, title, body, data);
//     } else if (userId) {
//       // Send based on userId (fetches from DB)
//       console.log(`📣 Sending notification to userId: ${userId}`);
//       const isMobile = platform === 'mobile';
//       response = await sendPushNotification(userId, title, body, data, isMobile);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Either userId or token is required',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Notification sent successfully',
//       data: {
//         response,
//       },
//     });
//   } catch (error) {
//     console.error('Send Notification Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send notification',
//       error: error.message,
//     });
//   }
// };



export const sendNotification = async (req, res) => {
  try {
    const {
      userId,
      token,
      title,
      body,
      data = {},
      platform = 'web', // 'web' | 'mobile'
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    // ✅ FINAL CORRECT PAYLOAD
    const payload = {
      notification: {
        title: String(title),
        body: String(body),
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    };

    let response;

    if (token) {
      console.log(`📣 Sending ${platform} notification to token...`);
      response = await sendPushToToken(token, payload);
    } else if (userId) {
      console.log(`📣 Sending ${platform} notification to userId: ${userId}`);
      const isMobile = platform === 'mobile';
      response = await sendPushNotification(userId, payload, isMobile);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either userId or token is required',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: { response },
    });
  } catch (error) {
    console.error('Send Notification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

/**
 * @desc    Get All Sub-Admins
 * @route   GET /api/admin/subadmins
 * @access  Private (Admin/SuperAdmin)
 */
export const getSubAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admin or super_admin can view subadmins'
      });
    }

    const subadmins = await Admin.find({ role: 'subadmin' }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        subadmins: subadmins.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: s.role,
          permissions: s.permissions,
          isActive: s.isActive,
          createdAt: s.createdAt,
          lastLogin: s.lastLogin
        }))
      }
    });
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subadmins',
      error: error.message
    });
  }
};

/**
 * @desc    Create a New Sub-Admin
 * @route   POST /api/admin/subadmins
 * @access  Private (Admin/SuperAdmin)
 */
export const createSubAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admin or super_admin can create subadmins'
      });
    }

    const { name, email, phone, password, permissions } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required'
      });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const subadmin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password, // hashed by pre-save hook
      role: 'subadmin',
      permissions: permissions || [],
      isActive: true,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Subadmin created successfully',
      data: {
        subadmin: {
          id: subadmin._id,
          name: subadmin.name,
          email: subadmin.email,
          phone: subadmin.phone,
          role: subadmin.role,
          permissions: subadmin.permissions,
          isActive: subadmin.isActive,
          createdAt: subadmin.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating subadmin',
      error: error.message
    });
  }
};

/**
 * @desc    Update Sub-Admin
 * @route   PUT /api/admin/subadmins/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const updateSubAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admin or super_admin can update subadmins'
      });
    }

    const { id } = req.params;
    const { name, email, phone, password, permissions, isActive } = req.body;

    const subadmin = await Admin.findById(id);
    if (!subadmin) {
      return res.status(404).json({
        success: false,
        message: 'Subadmin not found'
      });
    }

    if (name !== undefined) subadmin.name = name.trim();
    if (email !== undefined) subadmin.email = email.toLowerCase().trim();
    if (phone !== undefined) subadmin.phone = phone.trim();
    if (permissions !== undefined) subadmin.permissions = permissions;
    if (isActive !== undefined) subadmin.isActive = isActive;

    if (password && password.trim() !== '') {
      subadmin.password = password; // hashed by pre-save hook
    }

    await subadmin.save();

    res.status(200).json({
      success: true,
      message: 'Subadmin updated successfully',
      data: {
        subadmin: {
          id: subadmin._id,
          name: subadmin.name,
          email: subadmin.email,
          phone: subadmin.phone,
          role: subadmin.role,
          permissions: subadmin.permissions,
          isActive: subadmin.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subadmin',
      error: error.message
    });
  }
};

/**
 * @desc    Delete Sub-Admin
 * @route   DELETE /api/admin/subadmins/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const deleteSubAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admin or super_admin can delete subadmins'
      });
    }

    const { id } = req.params;
    const subadmin = await Admin.findByIdAndDelete(id);

    if (!subadmin) {
      return res.status(404).json({
        success: false,
        message: 'Subadmin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subadmin deleted successfully'
    });
  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting subadmin',
      error: error.message
    });
  }
};

/**
 * @desc    Get All Distinct Staff Roles
 * @route   GET /api/admin/notifications/roles
 * @access  Private (Admin)
 */
export const getStaffRoles = async (req, res) => {
  try {
    const roles = await Staff.distinct('role', { isDeleted: { $ne: true } });
    res.status(200).json({
      success: true,
      data: {
        roles: roles.filter(role => role && role.trim() !== '')
      }
    });
  } catch (error) {
    console.error('Get staff roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching staff roles',
      error: error.message
    });
  }
};

/**
 * @desc    Send role-wise notification with image support
 * @route   POST /api/admin/notifications/send-role
 * @access  Private (Admin)
 */
export const sendRoleNotification = async (req, res) => {
  try {
    const { role, title, message } = req.body;

    if (!role || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Role, title, and message are required'
      });
    }

    let imageUrl = null;
    if (req.file) {
      const uploadResult = await uploadImage(req.file, {
        folder: 'admin/notifications'
      });
      imageUrl = uploadResult.secure_url;
    }

    // Determine target collection and recipient model
    let recipients = [];
    let recipientModel = 'Staff';

    if (role === 'Customer') {
      // Find active customers
      recipients = await User.find({ isDeleted: { $ne: true }, accountStatus: 'active' });
      recipientModel = 'User';
    } else {
      // Find active staff by role
      recipients = await Staff.find({ role: role, isDeleted: { $ne: true } });
      recipientModel = 'Staff';
    }

    if (recipients.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active recipients found with role: ${role}`
      });
    }

    // Create notifications for all recipients matching the target
    const notifications = recipients.map(recipient => ({
      recipient: recipient._id,
      recipientModel: recipientModel,
      title,
      message,
      type: 'broadcast',
      image: imageUrl,
      isSent: true
    }));

    await Notification.insertMany(notifications);

    // Send push notifications
    const payload = {
      notification: {
        title,
        body: message,
        ...(imageUrl ? { image: imageUrl } : {})
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...(imageUrl ? { image: imageUrl } : {})
      }
    };

    const pushPromises = recipients.map(recipient => {
      const hasToken = recipient.fcmToken || recipient.fcmTokenMobile;
      if (hasToken) {
        if (recipientModel === 'User') {
          return sendPushNotification(recipient._id, payload, true);
        } else {
          return sendStaffPushNotification(recipient._id, payload, true);
        }
      }
      return Promise.resolve();
    });

    // Run in parallel but handle errors gracefully
    Promise.all(pushPromises).catch(err => {
      console.error('Push notification background sending error:', err);
    });

    res.status(200).json({
      success: true,
      message: `Notification broadcasted successfully to ${recipients.length} ${role === 'Customer' ? 'customers' : 'staff members'}`
    });
  } catch (error) {
    console.error('Send role notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending notification',
      error: error.message
    });
  }
};

/**
 * @desc    Get All Sent Notifications History
 * @route   GET /api/admin/notifications
 * @access  Private (Admin)
 */
export const getSentNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matchQuery = {
      $or: [
        { type: 'broadcast' },
        { type: 'info', relatedId: null }
      ],
      recipientModel: { $in: ['Staff', 'User'] }
    };

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            title: '$title',
            message: '$message',
            image: '$image',
            recipientModel: '$recipientModel',
            dateGroup: {
              $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' }
            }
          },
          createdAt: { $first: '$createdAt' },
          recipientCount: { $sum: 1 },
          sampleRecipient: { $first: '$recipient' }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await Notification.aggregate(pipeline);
    const notificationsGrouped = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    const staffIds = [];
    const userIds = [];

    notificationsGrouped.forEach(notif => {
      if (notif.sampleRecipient) {
        if (notif._id.recipientModel === 'User') {
          userIds.push(notif.sampleRecipient);
        } else {
          staffIds.push(notif.sampleRecipient);
        }
      }
    });

    const [staffList, userList] = await Promise.all([
      staffIds.length > 0 ? mongoose.model('Staff').find({ _id: { $in: staffIds } }).select('name role email phone').lean() : [],
      userIds.length > 0 ? mongoose.model('User').find({ _id: { $in: userIds } }).select('name email phone').lean() : []
    ]);

    const staffMap = {};
    staffList.forEach(s => { staffMap[s._id.toString()] = s; });

    const userMap = {};
    userList.forEach(u => { userMap[u._id.toString()] = u; });

    const formattedNotifications = notificationsGrouped.map((notif, idx) => {
      const isUser = notif._id.recipientModel === 'User';
      const sampleRecId = notif.sampleRecipient ? notif.sampleRecipient.toString() : null;
      const recipientDetails = isUser ? userMap[sampleRecId] : staffMap[sampleRecId];

      const roleName = isUser ? 'Customer' : (recipientDetails?.role || 'Staff');
      
      return {
        id: `${notif._id.title}-${notif._id.message}-${notif.createdAt}-${idx}`,
        title: notif._id.title,
        message: notif._id.message,
        type: 'broadcast',
        image: notif._id.image,
        createdAt: notif.createdAt,
        recipientModel: notif._id.recipientModel,
        recipient: {
          id: sampleRecId || '',
          name: isUser ? `All Customers` : `All ${roleName}s`,
          role: roleName,
          email: `${notif.recipientCount} Recipients`,
          phone: `Total: ${notif.recipientCount}`
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sent notifications',
      error: error.message
    });
  }
};

/**
 * @desc    Adjust User Guarantor Coins (Credit/Debit)
 * @route   POST /api/admin/users/:userId/adjust-points
 * @access  Private (Admin)
 */
export const adjustUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount, reason } = req.body;

    console.log('🪙 Adjust user points request:', { userId, type, amount, reason });

    // Validate inputs
    if (!type || !['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment type. Must be credit or debit.',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number.',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required.',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const currentPoints = user.points || 0;

    if (type === 'debit') {
      if (currentPoints < numericAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. User has 🪙${Math.floor(currentPoints)} but attempting to debit 🪙${numericAmount}.`,
        });
      }
      user.points = currentPoints - numericAmount;
      user.totalPointsUsed = (user.totalPointsUsed || 0) + numericAmount;
    } else {
      user.points = currentPoints + numericAmount;
      user.totalPointsEarned = (user.totalPointsEarned || 0) + numericAmount;
    }

    await user.save();

    // Create the GuarantorPoints adjustment log
    const adjustmentLog = new GuarantorPoints({
      guarantor: userId,
      pointsAllocated: type === 'credit' ? numericAmount : -numericAmount,
      status: 'active',
      isAdjustment: true,
      adjustmentType: type,
      reason: reason.trim(),
      adminUser: req.user._id,
    });

    await adjustmentLog.save();

    // Format user for response
    const userObj = user.toObject();
    userObj.id = userObj._id;
    if (userObj.isPhoneVerified && userObj.isEmailVerified) {
      userObj.kycStatus = 'verified';
    } else {
      userObj.kycStatus = 'pending';
    }
    if (!userObj.accountStatus) {
      userObj.accountStatus = 'active';
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${type}ed 🪙${numericAmount} points.`,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    console.error('❌ Adjust user points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adjusting user points.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



