import User from '../models/User.js';
import Staff from '../models/Staff.js';
import { uploadImage, isConfigured } from '../services/cloudinary.service.js';
import Booking from '../models/Booking.js';
import { sendPushNotification } from '../services/firebase.service.js';
import GuarantorRequest from '../models/GuarantorRequest.js';

/**
 * @desc    Send Returning Soon Notification
 * @route   POST /api/user/notify-returning
 * @access  Private
 */
export const sendReturningNotification = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id }).populate('carId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const user = await User.findById(req.user._id);

    if (user && user.fcmToken) {
      const carName = booking.carId ? `${booking.carId.brand} ${booking.carId.model}` : 'Car';
      const title = "Returning Soon ⏳";
      const body = `Your ${carName} is returning in less than 2 hours. Please be on time!`;

      await sendPushNotification(user._id, title, body, {
        type: 'returning_soon',
        bookingId: booking._id.toString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      });

      // Try to send to web token if exists (assuming field name, or rely on same field if shared)
      // If separate web token exists (e.g. fcmTokenWeb), add here.
    }

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Send returning notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Calculate profile completion percentage
 * @param {Object} user - User object
 * @returns {number} - Completion percentage (0-100)
 */
const calculateProfileComplete = (user) => {
  const fields = [
    'name',
    'email',
    'phone',
    'age',
    'gender',
    'address',
    'profilePhoto',
  ];

  let completedFields = 0;

  fields.forEach((field) => {
    // Check if field exists and is not empty
    if (user[field] !== undefined && user[field] !== null && user[field] !== '') {
      completedFields++;
    }
  });

  return Math.round((completedFields / fields.length) * 100);
};

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate profile completion
    const profileComplete = calculateProfileComplete(user);

    // Update profile completion in database if changed
    if (user.profileComplete !== profileComplete) {
      user.profileComplete = profileComplete;
      await user.save();
    }

    // Fetch latest guarantor request for this user (acting as renter)
    const guarantorRequest = await GuarantorRequest.findOne({ user: user._id })
      .populate('guarantor', 'name email phone isKYCVerified')
      .sort({ createdAt: -1 });

    const guarantorStatus = guarantorRequest ? {
      added: true,
      verified: guarantorRequest.status === 'accepted' && !!guarantorRequest.guarantor?.isKYCVerified,
      status: guarantorRequest.status,
      details: {
        name: guarantorRequest.guarantor?.name || '',
        email: guarantorRequest.guarantor?.email || '',
        phone: guarantorRequest.guarantor?.phone || '',
      }
    } : {
      added: false,
      verified: false,
      details: null
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name || '',
          email: user.email,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          address: user.address || '',
          profilePhoto: user.profilePhoto || '',
          rcDocument: user.rcDocument || '',
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          referralCode: user.referralCode,
          guarantorId: user.guarantorId || '',
          profileComplete: user.profileComplete,
          guarantor: guarantorStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          kycDetails: {
            aadhaar: {
              idNumber: user.kycDetails?.aadhaar?.number || '',
              isVerified: user.kycDetails?.aadhaar?.verified || false,
              verifiedAt: user.kycDetails?.aadhaar?.verifiedAt || null,
            },
            pan: {
              idNumber: user.kycDetails?.pan?.number || '',
              isVerified: user.kycDetails?.pan?.verified || false,
              verifiedAt: user.kycDetails?.pan?.verifiedAt || null,
            },
            dl: {
              idNumber: user.kycDetails?.dl?.number || '',
              dob: user.kycDetails?.dl?.dob || '',
              expiryDate: user.kycDetails?.dl?.expiryDate || '',
              isVerified: user.kycDetails?.dl?.verified || false,
              verifiedAt: user.kycDetails?.dl?.verifiedAt || null,
            }
          },
          isKYCVerified: user.isKYCVerified || false,
          notificationPreferences: {
            push: user.notificationPreferences?.push !== false,
            email: user.notificationPreferences?.email !== false,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, age, gender, address } = req.body;
    console.log('📝 Update Profile - Received data:', { name, email, age, gender, address });

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Handle email update (ensure uniqueness and valid format)
    if (email !== undefined && email !== null && email !== '' && email.trim().toLowerCase() !== user.email?.toLowerCase()) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }
      const existingUser = await User.findOne({ email: trimmedEmail, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account',
        });
      }
      user.email = trimmedEmail;
      user.isEmailVerified = false;
      console.log('✅ Updated email:', user.email);
    }

    // Update allowed fields (only update if provided)
    if (name !== undefined && name !== null && name !== '') {
      user.name = name.trim();
      console.log('✅ Updated name:', user.name);
    }

    // Handle age - can be number or string
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = typeof age === 'number' ? age : parseInt(String(age), 10);
      console.log('🔍 Age processing:', { age, ageNum, isValid: !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100 });
      if (!isNaN(ageNum) && ageNum >= 18 && ageNum <= 100) {
        user.age = ageNum;
        console.log('✅ Updated age:', user.age);
      } else {
        console.warn('⚠️ Invalid age value:', age, '->', ageNum, '(must be between 18-100)');
      }
    } else {
      console.log('ℹ️ Age not provided or empty');
    }

    // Handle gender
    if (gender !== undefined && gender !== null && gender !== '') {
      const genderLower = String(gender).toLowerCase();
      if (['male', 'female', 'other'].includes(genderLower)) {
        user.gender = genderLower;
        console.log('✅ Updated gender:', user.gender);
      } else {
        console.warn('⚠️ Invalid gender value:', gender, '(must be male, female, or other)');
      }
    } else {
      console.log('ℹ️ Gender not provided or empty');
    }

    // Handle address
    if (address !== undefined && address !== null && address !== '') {
      user.address = address.trim();
      console.log('✅ Updated address:', user.address);
    } else {
      console.log('ℹ️ Address not provided or empty');
    }

    // Calculate and update profile completion
    user.profileComplete = calculateProfileComplete(user);
    console.log('📊 Profile completion:', user.profileComplete + '%');

    await user.save();
    console.log('💾 User saved successfully');

    // Fetch latest guarantor request for this user (acting as renter)
    const guarantorRequest = await GuarantorRequest.findOne({ user: user._id })
      .populate('guarantor', 'name email phone isKYCVerified')
      .sort({ createdAt: -1 });

    const guarantorStatus = guarantorRequest ? {
      added: true,
      verified: guarantorRequest.status === 'accepted' && !!guarantorRequest.guarantor?.isKYCVerified,
      status: guarantorRequest.status,
      details: {
        name: guarantorRequest.guarantor?.name || '',
        email: guarantorRequest.guarantor?.email || '',
        phone: guarantorRequest.guarantor?.phone || '',
      }
    } : {
      added: false,
      verified: false,
      details: null
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name || '',
          email: user.email,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          address: user.address || '',
          profilePhoto: user.profilePhoto || '',
          profileComplete: user.profileComplete,
          guarantor: guarantorStatus,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          referralCode: user.referralCode,
          kycDetails: {
            aadhaar: {
              idNumber: user.kycDetails?.aadhaar?.number || '',
              isVerified: user.kycDetails?.aadhaar?.verified || false,
              verifiedAt: user.kycDetails?.aadhaar?.verifiedAt || null,
            },
            pan: {
              idNumber: user.kycDetails?.pan?.number || '',
              isVerified: user.kycDetails?.pan?.verified || false,
              verifiedAt: user.kycDetails?.pan?.verifiedAt || null,
            },
            dl: {
              idNumber: user.kycDetails?.dl?.number || '',
              dob: user.kycDetails?.dl?.dob || '',
              expiryDate: user.kycDetails?.dl?.expiryDate || '',
              isVerified: user.kycDetails?.dl?.verified || false,
              verifiedAt: user.kycDetails?.dl?.verifiedAt || null,
            }
          },
          isKYCVerified: user.isKYCVerified || false,
          notificationPreferences: {
            push: user.notificationPreferences?.push !== false,
            email: user.notificationPreferences?.email !== false,
          },
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Upload profile photo
 * @route   POST /api/user/upload-photo
 * @access  Private
 */
export const uploadPhoto = async (req, res) => {
  try {
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

    // Validate file type (already validated by multer, but double-check)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      });
    }

    // Validate file size (already validated by multer, but double-check)
    const maxSize = 5 * 1024 * 1024; // 5MB
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
      folder: 'driveon/profile-photos',
      width: 800,
      height: 800,
      crop: 'limit',
    });

    // Update user profile photo
    const user = await User.findById(req.user._id);

    // Delete old photo from Cloudinary if exists
    if (user.profilePhoto) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
        const urlParts = user.profilePhoto.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithVersion.split('.')[0]; // Remove extension
          const { deleteImage } = await import('../services/cloudinary.service.js');
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting old photo:', deleteError);
        // Continue even if old photo deletion fails
      }
    }

    user.profilePhoto = uploadResult.secure_url;
    user.profileComplete = calculateProfileComplete(user);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: uploadResult.secure_url,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePhoto: uploadResult.secure_url,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading photo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get KYC status
 * @route   GET /api/user/kyc-status
 * @access  Private
 */
export const getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // TODO: Implement KYC model and status check
    // For now, return default status
    res.status(200).json({
      success: true,
      data: {
        aadhaarVerified: user.kycDetails?.aadhaar?.verified || false,
        panVerified: user.kycDetails?.pan?.verified || false,
        drivingLicenseVerified: user.kycDetails?.dl?.verified || false,
        kycVerified: user.isKYCVerified || false,
      },
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching KYC status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/user/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Find user with password field
    let user = await User.findById(req.user._id).select('+password');
    let isStaff = false;

    // If not found in User, check/try Staff
    if (!user) {
      user = await Staff.findById(req.user._id).select('+password');
      isStaff = true;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User/Staff not found',
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    if (isStaff) {
      user.plainTextPassword = newPassword;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update user location
 * @route   POST /api/user/update-location
 * @access  Private
 */
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;

    // Validate required fields
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be numbers',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    let user = await User.findById(req.user._id);

    // If not found in User, check/try Staff (for Employee App)
    if (!user) {
      user = await Staff.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User/Staff not found',
      });
    }

    // Update location
    user.location = {
      latitude: lat,
      longitude: lng,
      address: address || user.location?.address || '',
      lastLocationUpdate: new Date(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          address: user.location.address,
          lastLocationUpdate: user.location.lastLocationUpdate,
        },
      },
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



/**
 * @desc    Upload RC document
 * @route   POST /api/user/upload-rc-document
 * @access  Private
 */
export const uploadRcDocument = async (req, res) => {
  try {
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
        message: 'Please provide a RC document',
      });
    }

    const file = req.file;

    // Validate file type (already validated by multer, but double-check)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      });
    }

    // Validate file size (already validated by multer, but double-check)
    const maxSize = 5 * 1024 * 1024; // 5MB
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
      folder: 'driveon/rc-documents',
      width: 1200,
      crop: 'limit',
    });

    // Update user RC document
    const user = await User.findById(req.user._id);

    // Delete old RC document from Cloudinary if exists
    if (user.rcDocument) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.rcDocument.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithVersion.split('.')[0];
          const { deleteImage } = await import('../services/cloudinary.service.js');
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting old RC document:', deleteError);
      }
    }

    user.rcDocument = uploadResult.secure_url;
    // Don't update profileComplete for optional field unless requested
    await user.save();

    res.status(200).json({
      success: true,
      message: 'RC document uploaded successfully',
      data: {
        rcDocument: uploadResult.secure_url,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          rcDocument: uploadResult.secure_url,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (error) {
    console.error('Upload RC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading RC document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Soft delete user account
 * @route   DELETE /api/user/profile
 * @access  Private
 */
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete
    user.isDeleted = true;
    user.isActive = false;
    user.accountStatus = 'suspended'; // Using suspended as deleted isn't in enum but we can add it or just use isActive/isDeleted
    
    // Actually, let's just use isDeleted as the main flag.
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
    });
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/user/notification-preferences
 * @access  Private
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { push, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only update fields that were explicitly provided
    if (push !== undefined) {
      user.notificationPreferences = user.notificationPreferences || {};
      user.notificationPreferences.push = !!push;
    }
    if (email !== undefined) {
      user.notificationPreferences = user.notificationPreferences || {};
      user.notificationPreferences.email = !!email;
    }

    user.markModified('notificationPreferences');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: {
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notification preferences',
    });
  }
};
