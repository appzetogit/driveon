import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      min: [18, 'Age must be at least 18'],
      max: [100, 'Age must be less than 100'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String, // Cloudinary URL
    },
    rcDocument: {
      type: String, // Cloudinary URL
      default: '',
    },
    profileComplete: {
      type: Number,
      default: 0, // Percentage 0-100
    },
    role: {
      type: String,
      enum: ['user', 'owner', 'guarantor'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    guarantorId: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    referralPointsAdjustment: {
      type: Number,
      default: 0,
    },
    referralSignupPointsAwarded: {
      type: Boolean,
      default: false,
    },
    referralTripPointsAwarded: {
      type: Boolean,
      default: false,
    },
    heardAbout: {
      type: String,
      trim: true,
      enum: ['', 'friend_family', 'social_media', 'google_search', 'ads', 'office_visit', 'other'],
      default: '',
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    // Location tracking fields
    location: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      address: {
        type: String,
        default: '',
      },
      lastLocationUpdate: {
        type: Date,
        default: null,
      },
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
      minlength: [6, 'Password must be at least 6 characters'],
    },
    fcmToken: {
      type: String,
      default: null
    },
    fcmTokenMobile: {
      type: String,
      default: null
    },
    // KYC Verification Details
    kycDetails: {
      aadhaar: {
        number: String,
        verified: { type: Boolean, default: false },
        requestId: String, // For OTP verification
        verifiedAt: Date,
        image: String
      },
      pan: {
        number: String,
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        image: String
      },
      dl: {
        number: String,
        dob: String,
        expiryDate: String,
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        image: String
      }
    },
    isKYCVerified: {
      type: Boolean,
      default: false
    },
    // User notification preferences
    notificationPreferences: {
      push: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if password is modified and exists)
userSchema.pre('save', async function (next) {
  // Hash password if it's modified and exists
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate referral code before saving (only for new users)
  if (this.isNew && !this.referralCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DRIVE';

    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const existingUser = await mongoose.model('User').findOne({ referralCode: code });
    if (!existingUser) {
      this.referralCode = code;
    } else {
      // If exists, generate again
      code = 'DRIVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
      this.referralCode = code;
    }
  }

  // Generate guarantor ID before saving (only for new users)
  // Random generation similar to booking ID (GURN + timestamp + random chars)
  if (this.isNew && !this.guarantorId) {
    let guarantorId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to generate a unique guarantorId with random format
    while (!isUnique && attempts < maxAttempts) {
      // Generate random guarantor ID: GURN + 6-digit timestamp + 3 random uppercase chars
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      guarantorId = `GURN${timestamp}${random}`;

      // Check if this guarantorId already exists
      const existing = await mongoose.model('User').findOne({ guarantorId });
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
        // Add more randomness if collision occurs
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // If still not unique after max attempts, use more random ID
    if (!isUnique) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      guarantorId = `GURN${timestamp}${random}`;
    }

    this.guarantorId = guarantorId;
    console.log('✅ Generated guarantorId in pre-save hook:', this.guarantorId);
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

