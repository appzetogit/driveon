import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import OTP from '../models/OTP.js';
import CRMRole from '../models/CRMRole.js';
import { generateOTP, getOTPExpiry, isOTPExpired, sendOTP } from '../utils/otp.service.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { processReferralSignup } from './referral.controller.js';
import sendEmail from '../utils/sendEmail.js';
import { sendAdminNotification } from '../services/firebase.service.js';

/**
 * @desc    Register new user (Send OTP)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, phone, referralCode, fullName, name, heardAbout } = req.body;

    // Validation
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone number are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate and normalize phone number (10 digits, must start with 6-9 for Indian mobile)
    const cleanedPhone = phone.replace(/\D/g, ''); // Remove all non-digits
    if (!cleanedPhone || cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number (starting with 6-9).',
      });
    }

    // Use cleaned phone number for all operations
    const normalizedPhone = cleanedPhone;

    // Check if user already exists (use normalized phone)
    const existingUser = await User.findOne({
      $or: [{ email }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      let message = 'User already exists';
      const emailExists = existingUser.email === email;
      const phoneExists = existingUser.phone === normalizedPhone;
      if (emailExists && phoneExists) {
        message = 'Email and phone number already registered';
      } else if (emailExists) {
        message = 'Email already registered';
      } else if (phoneExists) {
        message = 'Phone number already registered';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Handle referral code
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Generate OTP (pass normalized phone for test number detection)
    const otp = generateOTP(normalizedPhone).toString();
    const expiresAt = getOTPExpiry(10); // 10 minutes

    // Handle FCM Token if provided during signup
    const { fcmToken, platform } = req.body;
    const fcmData = {};
    if (fcmToken) {
      if (platform === 'mobile') {
        fcmData.fcmTokenMobile = fcmToken;
      } else {
        fcmData.fcmToken = fcmToken;
      }
    }

    const userName = (fullName || name || '').trim();

    // Store OTP in database
    await OTP.create({
      identifier: normalizedPhone,
      otp,
      type: 'phone',
      purpose: 'register',
      expiresAt,
      isUsed: false,
      signupData: {
        email,
        phone: normalizedPhone,
        name: userName,
        referredBy,
        heardAbout: heardAbout || '',
        ...fcmData
      }
    });

    // Send OTP via SMS (will skip for test numbers)
    let smsSent = false;
    let smsErrorOccurred = false;
    let smsErrorMessage = null;

    try {
      console.log(`\n📱 ===== Registration OTP Send Attempt =====`);
      console.log(`📱 Phone: ${normalizedPhone}`);
      console.log(`📱 OTP: ${otp}`);
      console.log(`📱 Purpose: register`);

      const smsResult = await sendOTP(normalizedPhone, otp, 'register');

      // Verify SMS was actually sent successfully (all users receive real SMS)
      if (smsResult.success === false || smsResult.status === 'failed') {
        smsErrorOccurred = true;
        smsErrorMessage = smsResult.error || 'SMS sending failed - unknown error';
        console.error(`❌ SMS Result indicates failure:`, smsResult);
      } else {
        smsSent = true;
        console.log(`✅ OTP sent successfully to ${normalizedPhone} via SMSIndia Hub`);
        console.log(`📱 SMS Details:`, {
          messageId: smsResult.messageId,
          status: smsResult.status,
          provider: smsResult.provider,
          jobId: smsResult.jobId,
        });
      }
    } catch (smsError) {
      smsErrorOccurred = true;
      smsErrorMessage = smsError.message;
      console.error('\n❌ ===== SMS Sending Failed =====');
      console.error('❌ SMS Error:', smsError.message);
      console.error('❌ SMS Error Details:', {
        phone: normalizedPhone,
        otp: otp,
        error: smsError.message,
        stack: process.env.NODE_ENV === 'development' ? smsError.stack : undefined,
      });
      console.error('❌ =================================\n');
    }

    // Check if SMS failed and handle accordingly
    if (smsErrorOccurred || !smsSent) {
      // Check if it's a test number (allow failure for test numbers in development)
      const isTestNumber = normalizedPhone && ['9993911855'].some(testNum => normalizedPhone.endsWith(testNum));

      if (isTestNumber && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Test number - SMS failed but allowing registration in development mode. OTP: ${otp}`);
        smsSent = true; // Mark as sent for test numbers
      } else {
        // For real numbers, return error if SMS fails
        console.error(`\n❌ SMS FAILED for real number: ${normalizedPhone}`);
        console.error(`❌ Real numbers must receive real SMS from SMS Hub. Registration blocked.`);
        console.error(`❌ Error: ${smsErrorMessage || 'Unknown error'}\n`);

        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please check your phone number and try again.',
          error: process.env.NODE_ENV === 'development' ? (smsErrorMessage || 'SMS service unavailable') : 'SMS service unavailable',
          phone: normalizedPhone,
        });
      }
    }

    console.log(`📱 ===== Registration OTP Send Complete =====\n`);

    if (fcmToken) {
      console.log(`✅ FCM Token captured during registration for ${normalizedPhone}:`, fcmToken.substring(0, 20) + '...');
    } else {
      console.error('\n❌❌❌ CRITICAL: NO FCM TOKEN RECEIVED FROM FRONTEND ❌❌❌');
      console.error('👉 Check Frontend "requestForToken" logic');
      console.error('👉 Check if Browser Permission is ALLOWED');
      console.error('👉 Check if VAPID Key is correct in Frontend .env');
      console.error('------------------------------------------------------\n');
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email,
        phone: normalizedPhone,
        otpSent: smsSent,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Send OTP for login
 * @route   POST /api/auth/send-login-otp
 * @access  Public
 */
export const sendLoginOTP = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    console.log(`\n📱 ===== Login OTP Request =====`);
    console.log(`📱 Input: ${emailOrPhone}`);

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    // Determine if it's email or phone
    const isEmail = emailOrPhone.includes('@');
    let phone = isEmail ? null : emailOrPhone.replace(/\D/g, '');
    const email = isEmail ? emailOrPhone : null;

    console.log(`📱 Type: ${isEmail ? 'Email' : 'Phone'}`);
    console.log(`📱 Phone: ${phone || 'N/A'}`);
    console.log(`📱 Email: ${email || 'N/A'}`);

    // Validate and normalize phone number if provided (10 digits, must start with 6-9 for Indian mobile)
    let normalizedPhone = phone;
    if (phone) {
      if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number (starting with 6-9).',
        });
      }
      normalizedPhone = phone; // Already cleaned, use as normalized
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Find user by email or phone (use normalized phone)
    console.log(`🔍 Searching for user...`);
    const user = await User.findOne({
      $or: [{ email: email || '' }, { phone: normalizedPhone || '' }],
    });

    if (!user) {
      console.log(`❌ User not found`);
      return res.status(400).json({
        success: false,
        message: 'User not found. Please signup first.',
      });
    }

    console.log(`✅ User found: ${user._id}`);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Generate OTP (pass normalized phone for test number detection)
    console.log(`🔐 Generating OTP...`);
    // Use normalizedPhone if available, otherwise null (for email login)
    const otpValue = generateOTP(normalizedPhone || null);
    const otp = otpValue.toString();
    const expiresAt = getOTPExpiry(10); // 10 minutes

    console.log(`🔐 OTP Generated: ${otp}`);
    console.log(`🔐 Expires At: ${expiresAt}`);
    console.log(`🔐 For: ${normalizedPhone ? `Phone ${normalizedPhone}` : `Email ${email}`}`);

    // Store OTP in database (use normalized phone)
    const identifier = normalizedPhone || email;

    // Validate identifier is not empty
    if (!identifier || identifier.trim() === '') {
      console.error(`❌ Invalid identifier: ${identifier}`);
      throw new Error('Invalid identifier: phone or email is required');
    }

    console.log(`💾 Storing OTP in database...`);
    console.log(`💾 Identifier: ${identifier}`);
    console.log(`💾 Type: ${normalizedPhone ? 'phone' : 'email'}`);

    try {
      const otpRecord = await OTP.create({
        identifier: identifier.trim(),
        otp: otp.toString(),
        type: normalizedPhone ? 'phone' : 'email',
        purpose: 'login',
        expiresAt,
        isUsed: false,
      });
      console.log(`✅ OTP stored in database with ID: ${otpRecord._id}`);
    } catch (dbError) {
      console.error(`❌ Database error storing OTP:`, dbError);
      console.error(`❌ Error details:`, {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        keyPattern: dbError.keyPattern,
        keyValue: dbError.keyValue,
      });
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    // Send OTP via SMS (if phone) or Email (if email)
    // Use same approach as register - SMSIndia Hub service handles promotional SMS automatically
    let smsSent = false;
    let smsErrorOccurred = false;
    let smsErrorMessage = null;

    try {
      if (normalizedPhone) {
        console.log(`\n📱 ===== Login OTP Send Attempt =====`);
        console.log(`📱 Phone: ${normalizedPhone}`);
        console.log(`📱 OTP: ${otp}`);
        console.log(`📱 Purpose: login`);

        const smsResult = await sendOTP(normalizedPhone, otp, 'login');

        if (smsResult.isTest) {
          console.log(`🧪 Test mode: Login OTP ${otp} generated for ${normalizedPhone} (SMS skipped)`);
          smsSent = true;
        } else {
          // Verify SMS was actually sent successfully
          if (smsResult.success === false || smsResult.status === 'failed') {
            smsErrorOccurred = true;
            smsErrorMessage = smsResult.error || 'SMS sending failed - unknown error';
            console.error(`❌ SMS Result indicates failure:`, smsResult);
          } else {
            smsSent = true;
            console.log(`✅ Login OTP sent successfully to ${normalizedPhone} via SMSIndia Hub`);
            console.log(`📱 SMS Details:`, {
              messageId: smsResult.messageId,
              status: smsResult.status,
              provider: smsResult.provider,
              jobId: smsResult.jobId,
            });
          }
        }
      } else {
        // TODO: Implement email OTP sending
        console.log(`⚠️ Email OTP not implemented yet. OTP: ${otp}`);
        smsSent = false; // Email OTP not sent
      }
    } catch (smsError) {
      smsErrorOccurred = true;
      smsErrorMessage = smsError.message;
      console.error('\n❌ ===== SMS Sending Failed =====');
      console.error('❌ SMS Error:', smsError.message);
      console.error('❌ SMS Error Details:', {
        phone: normalizedPhone,
        otp: otp,
        error: smsError.message,
        stack: process.env.NODE_ENV === 'development' ? smsError.stack : undefined,
      });
      console.error('❌ =================================\n');
    }

    // Check if SMS failed and handle accordingly (same as register)
    if (smsErrorOccurred || !smsSent) {
      // Check if it's a test number (only allow failure for test numbers in development)
      const isTestNumber = normalizedPhone && ['9993911855'].some(testNum => normalizedPhone.endsWith(testNum));

      if (isTestNumber && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Test number - SMS failed but allowing login in development mode. OTP: ${otp}`);
        smsSent = true; // Mark as sent for test numbers
      } else {
        // For real numbers, return error if SMS fails (same as register)
        console.error(`\n❌ SMS FAILED for real number: ${normalizedPhone}`);
        console.error(`❌ This number should receive real SMS. Login blocked.`);
        console.error(`❌ Error: ${smsErrorMessage || 'Unknown error'}\n`);

        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please check your phone number and try again.',
          error: process.env.NODE_ENV === 'development' ? (smsErrorMessage || 'SMS service unavailable') : 'SMS service unavailable',
          phone: normalizedPhone,
        });
      }
    }

    console.log(`✅ ===== Login OTP Send Complete =====\n`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: user.phone,
        email: user.email,
        otpSent: smsSent,
      },
    });
  } catch (error) {
    console.error('\n❌ ===== Send Login OTP Error =====');
    console.error('❌ Error Name:', error.name);
    console.error('❌ Error Message:', error.message);
    console.error('❌ Error Code:', error.code);

    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Full Error:', error);
      console.error('❌ Stack Trace:', error.stack);

      // Check for specific error types
      if (error.name === 'ValidationError') {
        console.error('❌ Validation Errors:', error.errors);
      }
      if (error.name === 'MongoServerError') {
        console.error('❌ MongoDB Error Code:', error.code);
        console.error('❌ MongoDB Error Details:', error.keyPattern, error.keyValue);
      }
    }
    console.error('❌ =================================\n');

    // Return detailed error in development, generic in production
    const errorResponse = {
      success: false,
      message: 'Server error during login OTP send',
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = error.message;
      errorResponse.errorType = error.name;
      if (error.stack) {
        errorResponse.stack = error.stack.split('\n').slice(0, 5).join('\n'); // First 5 lines of stack
      }
    }

    res.status(500).json(errorResponse);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. OTP must be 6 digits.',
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    // Validate and normalize phone number if provided
    let normalizedPhone = phone;
    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number (starting with 6-9).',
        });
      }
      normalizedPhone = cleanedPhone;
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Find OTP record (use normalized phone)
    const identifier = normalizedPhone || email;
    const otpRecord = await OTP.findOne({
      identifier,
      otp,
      isUsed: false,
    }).sort({ createdAt: -1 }); // Get latest OTP

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if this is a signup verification (not login)
    const isSignupVerification = otpRecord.purpose === 'register';

    let user;
    let isFirstVerification = false;

    if (isSignupVerification) {
      const signup = otpRecord.signupData;
      if (!signup) {
        return res.status(400).json({
          success: false,
          message: 'Signup data not found. Please try registering again.',
        });
      }

      // Check if user already exists
      user = await User.findOne({
        $or: [{ email: signup.email || '' }, { phone: signup.phone || '' }],
      });

      if (!user) {
        user = await User.create({
          email: signup.email,
          phone: signup.phone,
          name: signup.name,
          referredBy: signup.referredBy,
          heardAbout: signup.heardAbout || '',
          isEmailVerified: !!signup.email,
          isPhoneVerified: !!signup.phone,
          profileComplete: 0,
          fcmToken: signup.fcmToken,
          fcmTokenMobile: signup.fcmTokenMobile,
        });
        isFirstVerification = true;
      } else {
        if (signup.phone) user.isPhoneVerified = true;
        if (signup.email) user.isEmailVerified = true;
        await user.save();
      }
    } else {
      // Find user for login / other actions
      user = await User.findOne({
        $or: [{ email: email || '' }, { phone: phone || '' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Mark phone/email as verified (use normalized phone)
      if (normalizedPhone) {
        user.isPhoneVerified = true;
      }
      if (email) {
        user.isEmailVerified = true;
      }
      await user.save();
    }

    // Send Admin Notification for New Signup
    if (isSignupVerification && isFirstVerification) {
      const signupMethod = email ? 'Email' : 'Phone';
      const identifier = email || normalizedPhone;

      sendAdminNotification(
        'New User Signup 👤',
        `New user joined via ${signupMethod}: ${identifier}`,
        {
          type: 'new_user_signup',
          userId: user._id.toString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      ).catch(err => console.error('Failed to send admin signup notification:', err));
    }

    // Process referral signup if:
    // 1. This is a signup verification (purpose: 'register')
    // 2. User was referred by someone
    // 3. This is the first verification (to prevent duplicate points)
    if (isSignupVerification && user.referredBy && isFirstVerification) {
      // Award points to referrer for signup (runs asynchronously, doesn't block response)
      processReferralSignup(user._id.toString()).catch((error) => {
        console.error('Failed to process referral signup:', error);
        // Don't fail the signup if referral processing fails
      });
    }

    // Generate tokens
    const token = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Calculate profile completion
    const calculateProfileComplete = (user) => {
      const fields = ['name', 'email', 'phone', 'age', 'gender', 'address', 'profilePhoto'];
      let completedFields = 0;
      fields.forEach((field) => {
        if (user[field] && user[field] !== '') {
          completedFields++;
        }
      });
      return Math.round((completedFields / fields.length) * 100);
    };

    user.profileComplete = calculateProfileComplete(user);

    // Handle FCM Token update if provided during login/verification
    const { fcmToken, platform } = req.body;
    if (fcmToken) {
      if (platform === 'mobile') {
        user.fcmTokenMobile = fcmToken;
      } else {
        user.fcmToken = fcmToken;
      }
      console.log(`✅ FCM Token updated during Login/Verify for ${user.email || user.phone}:`, fcmToken.substring(0, 20) + '...');
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          name: user.name || '',
          age: user.age,
          gender: user.gender,
          address: user.address,
          profilePhoto: user.profilePhoto,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          referralCode: user.referralCode,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Staff Login
 * @route   POST /api/auth/staff-login
 * @access  Public
 */
export const staffLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and password',
      });
    }

    // Check for staff by phone number — strip non-digits, match last 10 digits
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const staff = await Staff.findOne({
      phone: { $regex: cleanPhone + '$' }
    });

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is deleted
    if (staff.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Check if password matches
    // Assuming matchPassword method exists on Staff model
    const isMatch = await staff.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(staff._id);
    const refreshToken = generateRefreshToken(staff._id);

    // Handle FCM Token update if provided during login
    const { fcmToken, platform } = req.body;
    if (fcmToken) {
      if (platform === 'mobile') {
        staff.fcmTokenMobile = fcmToken;
      } else {
        staff.fcmToken = fcmToken;
      }
      console.log(`✅✅✅ FCM TOKEN RECEIVED FOR STAFF: ${staff.name} (${fcmToken.substring(0, 15)}...) ✅✅✅`);
      await staff.save();
    } else {
      console.log(`❌❌❌ NO FCM TOKEN RECEIVED FROM STAFF FRONTEND: ${staff.name} ❌❌❌`);
    }

    // Fetch permissions associated with this role
    let permissions = [];
    try {
      if (staff.role) {
        const crmRole = await CRMRole.findOne({
          roleName: { $regex: new RegExp(`^${staff.role}$`, 'i') }
        });
        if (crmRole) {
          permissions = crmRole.permissions || [];
        }
      }
    } catch (roleError) {
      console.error('Error fetching role permissions:', roleError);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          permissions,
          employeeId: staff.employeeId,
          phone: staff.phone,
          department: staff.department,
          avatar: staff.avatar,
          joinDate: staff.joinDate,
          status: staff.status
        }
      }
    });

  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get Staff Profile
 * @route   GET /api/auth/staff-profile
 * @access  Private (Staff)
 */
export const getStaffProfile = async (req, res) => {
  try {
    const staff = req.user; // Attached by authenticateStaff middleware

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found'
      });
    }

    // Fetch permissions associated with this role
    let permissions = [];
    try {
      if (staff.role) {
        const crmRole = await CRMRole.findOne({
          roleName: { $regex: new RegExp(`^${staff.role}$`, 'i') }
        });
        if (crmRole) {
          permissions = crmRole.permissions || [];
        }
      }
    } catch (roleError) {
      console.error('Error fetching role permissions:', roleError);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          permissions,
          employeeId: staff.employeeId,
          phone: staff.phone,
          department: staff.department,
          avatar: staff.avatar,
          joinDate: staff.joinDate,
          status: staff.status
        }
      }
    });
  } catch (error) {
    console.error('Get Staff Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res) => {
  try {
    const { email, phone, purpose = 'register' } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    // Validate and normalize phone number if provided
    let normalizedPhone = phone;
    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number (starting with 6-9).',
        });
      }
      normalizedPhone = cleanedPhone;
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Find user (use normalized phone)
    const user = await User.findOne({
      $or: [{ email: email || '' }, { phone: normalizedPhone || '' }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new OTP (pass normalized phone for test number detection)
    const otp = generateOTP(normalizedPhone).toString();
    const expiresAt = getOTPExpiry(10); // 10 minutes

    // Store OTP in database (use normalized phone)
    const identifier = normalizedPhone || email;
    await OTP.create({
      identifier,
      otp,
      type: normalizedPhone ? 'phone' : 'email',
      purpose,
      expiresAt,
      isUsed: false,
    });

    // Send OTP via SMS
    let smsSent = false;
    try {
      if (normalizedPhone) {
        console.log(`📱 Attempting to resend OTP to phone: ${normalizedPhone}`);
        const smsResult = await sendOTP(normalizedPhone, otp, purpose);
        smsSent = true;

        if (smsResult.isTest) {
          console.log(`🧪 Test mode: OTP ${otp} resent for ${normalizedPhone} (SMS skipped)`);
        } else {
          console.log(`✅ OTP resent successfully to ${normalizedPhone} via SMSIndia Hub`);
          console.log(`📱 SMS Details:`, {
            messageId: smsResult.messageId,
            status: smsResult.status,
            provider: smsResult.provider,
          });
        }
      } else {
        // TODO: Implement email OTP sending
        console.log(`⚠️ Email OTP not implemented yet. OTP: ${otp}`);
      }
    } catch (smsError) {
      console.error('❌ SMS sending failed:', smsError.message);
      console.error('❌ SMS Error Details:', {
        phone: normalizedPhone,
        otp: otp,
        error: smsError.message,
        stack: process.env.NODE_ENV === 'development' ? smsError.stack : undefined,
      });

      // Always return error if SMS fails (even in development for real numbers)
      // Only allow in development if it's a test number
      const isTestNumber = normalizedPhone && ['9993911855'].some(testNum => normalizedPhone.endsWith(testNum));

      if (isTestNumber && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Test number - SMS failed but allowing resend in development mode. OTP: ${otp}`);
      } else {
        // Return error if SMS fails for real numbers
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please check your phone number and try again.',
          error: process.env.NODE_ENV === 'development' ? smsError.message : 'SMS service unavailable',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: user.phone,
        email: user.email,
        otpSent: true,
      },
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body;

    if (!refreshTokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshTokenValue,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
    );

    // Get user from database
    let user = await User.findById(decoded.id);
    let isStaff = false;

    // If not found in User collection, check Staff collection (for Employee App)
    if (!user) {
      const staff = await Staff.findById(decoded.id);
      if (staff) {
        user = staff;
        isStaff = true;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User/Staff not found',
      });
    }

    // Check active status
    if (isStaff) {
      // Staff status check (Active, On Duty, Leave are valid for login, Inactive/Terminated would be invalid if they existed)
      // Assuming 'Active' or similar is required. The enum is ['Active', 'On Duty', 'Leave'].
      // If there's no explicit 'Inactive' status in enum, we might assume they are active unless deleted.
      // However, let's keep it simple: if they exist, they are likely active enough to refresh token unless blocked.
      // If you strictly want to block others:
      // if (!['Active', 'On Duty', 'Leave'].includes(user.status)) ... 
      // For now, we'll assume existence implies access unless restricted logic is added.
    } else {
      // User active check
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }
    }

    // Generate new access token
    const newToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('⚠️ Refresh token expired for a user (normal behavior after expiry)');
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      console.warn('⚠️ Invalid refresh token attempt');
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    console.error('❌ Unexpected Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // TODO: Implement token blacklisting if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


/**
 * @desc    Forgot Password for Staff
 * @route   POST /api/auth/staff-forgot-password
 * @access  Public
 */
export const staffForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'No staff account found with this email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to database
    staff.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiry (10 minutes)
    staff.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await staff.save({ validateBeforeSave: false });

    // Create reset URL
    // Use live URL as requested
    const frontendUrl = 'https://driveoncar.co.in';
    const resetUrl = `${frontendUrl}/employee/reset-password/${resetToken}`;

    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #333; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e4e4e7; }
          .header { background-color: #1C205C; padding: 32px 24px; text-align: center; background-image: linear-gradient(135deg, #1C205C 0%, #1e1b4b 100%); }
          .logo-text { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; font-style: italic; letter-spacing: -0.025em; }
          .logo-highlight { color: #3B82F6; }
          .subheader { color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px; }
          .content { padding: 40px 32px; text-align: left; line-height: 1.6; color: #374151; }
          .greeting { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #111827; }
          .button-container { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background-color: #1C205C; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(28, 32, 92, 0.2); }
          .expiry-note { background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 24px 0; font-size: 14px; color: #be123c; border-radius: 4px; }
          .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .link-secondary { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
          .plain-link { color: #3b82f6; word-break: break-all; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">Drive<span class="logo-highlight">On</span></h1>
            <div class="subheader">Employee Portal</div>
          </div>
          <div class="content">
            <div class="greeting">Hello,</div>
            <p>We received a request to reset the password for your DriveOn Employee account.</p>
            <p>If you didn't ask to reset your password, you can simply ignore this email. Your account is safe and no changes were made.</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="expiry-note">
              <strong>Note:</strong> For security reasons, this password reset link will expire in 10 minutes.
            </div>


          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} DriveOn Systems. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: staff.email,
        subject: 'Password Reset Request - DriveOn Employee',
        html: message,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
      console.error('Email send error:', error);

      // In development mode, if email fails, log the URL and return success to allow testing
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development Mode: Email sending failed, but here is the reset URL:');
        console.log(resetUrl);

        // Don't clear the token
        return res.status(200).json({
          success: true,
          message: 'Email sending failed (Dev Mode). Check server console for link.',
          devUrl: resetUrl
        });
      }

      staff.resetPasswordToken = undefined;
      staff.resetPasswordExpire = undefined;
      await staff.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent', error: error.message });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset Password for Staff
 * @route   POST /api/auth/staff-reset-password/:resetToken
 * @access  Public
 */
export const staffResetPassword = async (req, res) => {
  try {
    // Get token from params and hash it to match database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const staff = await Staff.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!staff) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    staff.password = req.body.password;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordExpire = undefined;

    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * @desc    Save Staff FCM Token
 * @route   POST /api/auth/staff-fcm-token
 * @access  Private (Staff)
 */
export const saveStaffFcmToken = async (req, res) => {
  try {
    const { fcmToken, platform = "web" } = req.body;
    const staffId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required",
      });
    }

    const updateData = {};
    if (platform === "mobile") {
      updateData.fcmTokenMobile = fcmToken;
    } else {
      updateData.fcmToken = fcmToken;
    }

    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { $set: updateData },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FCM Token saved successfully",
      data: {
        id: staff._id,
        fcmToken: staff.fcmToken,
        fcmTokenMobile: staff.fcmTokenMobile,
      },
    });
  } catch (error) {
    console.error("Save Staff FCM Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving FCM token",
      error: error.message,
    });
  }
};

/**
 * @desc    Save User FCM Token
 * @route   POST /api/auth/user-fcm-token
 * @access  Private (User)
 */
export const saveUserFcmToken = async (req, res) => {
  try {
    const { fcmToken, platform = "web" } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required",
      });
    }

    const updateData = {};
    if (platform === "mobile") {
      updateData.fcmTokenMobile = fcmToken;
    } else {
      updateData.fcmToken = fcmToken;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FCM Token saved successfully",
      data: {
        id: user._id,
        fcmToken: user.fcmToken,
        fcmTokenMobile: user.fcmTokenMobile,
      },
    });
  } catch (error) {
    console.error("Save User FCM Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving FCM token",
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete staff account
 * @route   DELETE /api/auth/staff-profile
 * @access  Private (Staff)
 */
export const deleteStaffAccount = async (req, res) => {
  try {
    const staffId = req.user._id;
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Soft delete
    staff.isDeleted = true;
    staff.status = 'Inactive';
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Employee account deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting employee account',
    });
  }
};

/**
 * @desc    Upload staff profile photo
 * @route   POST /api/auth/staff-upload-photo
 * @access  Private (Staff)
 */
export const uploadStaffPhoto = async (req, res) => {
  try {
    const { uploadImage, deleteImage, isConfigured } = await import('../services/cloudinary.service.js');

    // Check if Cloudinary is configured
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Image upload service not configured. Please contact administrator.',
      });
    }

    // Check if file is provided (multer stores file in req.file)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a photo file',
      });
    }

    const file = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      });
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }

    // Convert file buffer to base64 Data URI for reliable Cloudinary upload
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(fileBase64, {
      folder: 'driveon/staff-avatars',
      width: 800,
      height: 800,
      crop: 'limit',
    });

    const staffId = req.user._id;
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (staff.avatar) {
      try {
        const urlParts = staff.avatar.split('/');
        const uploadIndex = urlParts.slice(0).findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithVersion.split('.')[0]; // Remove extension
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting old staff avatar:', deleteError);
      }
    }

    staff.avatar = uploadResult.secure_url;
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        avatar: uploadResult.secure_url,
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          employeeId: staff.employeeId,
          phone: staff.phone,
          department: staff.department,
          avatar: uploadResult.secure_url,
          joinDate: staff.joinDate,
          status: staff.status
        }
      },
    });
  } catch (error) {
    console.error('Upload staff photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading photo',
      error: error.message,
    });
  }
};

/**
 * @desc    Update Staff Profile (Name & Email only)
 * @route   PUT /api/auth/staff-profile
 * @access  Private (Staff)
 */
export const updateStaffProfile = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { name, email } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff profile not found',
      });
    }

    if (name !== undefined) {
      staff.name = name;
    }
    
    if (email !== undefined) {
      // Basic email validation if email is changing
      if (email && email !== staff.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format',
          });
        }
        
        // Check if email is already taken by another staff member
        const emailExists = await Staff.findOne({ email, _id: { $ne: staffId } });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use by another account',
          });
        }
        staff.email = email;
      } else if (email === '') {
        staff.email = '';
      }
    }

    await staff.save();

    // Fetch permissions associated with this role
    let permissions = [];
    try {
      if (staff.role) {
        const crmRole = await CRMRole.findOne({
          roleName: { $regex: new RegExp(`^${staff.role}$`, 'i') }
        });
        if (crmRole) {
          permissions = crmRole.permissions || [];
        }
      }
    } catch (roleError) {
      console.error('Error fetching role permissions in update:', roleError);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          permissions,
          employeeId: staff.employeeId,
          phone: staff.phone,
          department: staff.department,
          avatar: staff.avatar,
          joinDate: staff.joinDate,
          status: staff.status
        }
      }
    });
  } catch (error) {
    console.error('Update staff profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating staff profile',
      error: error.message
    });
  }
};
