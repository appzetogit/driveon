import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Admin Schema
 * Separate model for admin users with different requirements than regular users
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true, // For faster queries
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include password in queries by default
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin', 'subadmin'],
      default: 'admin',
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    profilePhoto: {
      type: String, // Cloudinary URL
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    department: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must not exceed 500 characters'],
    },
    fcmToken: {
      type: String, // Web Push Token
    },
    fcmTokenMobile: {
      type: String, // Mobile Push Token
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance

adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

/**
 * Pre-save hook to hash password
 */
adminSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for admin security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password
 * @param {String} candidatePassword - Password to compare
 * @returns {Boolean} - True if password matches
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to update last login
 * @param {String} ip - IP address
 */
adminSchema.methods.updateLastLogin = async function (ip) {
  this.lastLogin = new Date();
  this.lastLoginIP = ip;
  await this.save({ validateBeforeSave: false });
};

/**
 * Method to check if admin has permission
 * @param {String} permission - Permission to check
 * @returns {Boolean} - True if admin has permission
 */
adminSchema.methods.hasPermission = function (permission) {
  // Super admin has all permissions
  if (this.role === 'super_admin') {
    return true;
  }
  return this.permissions.includes(permission);
};

/**
 * Method to get admin data without sensitive information
 * @returns {Object} - Admin data without password
 */
adminSchema.methods.toJSON = function () {
  const adminObject = this.toObject();
  delete adminObject.password;
  delete adminObject.__v;
  return adminObject;
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;

