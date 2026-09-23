import mongoose from 'mongoose';

/**
 * Coupon Schema
 * Complete coupon model for discount management
 */
const couponSchema = new mongoose.Schema(
  {
    // Coupon Code
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      match: [/^[A-Z0-9\s()\-]+$/, 'Coupon code must contain only uppercase letters, numbers, spaces, parentheses and hyphens'],
    },

    // Discount Details
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, 'Max discount cannot be negative'],
    },
    minAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum amount cannot be negative'],
    },

    // Validity
    validityStart: {
      type: Date,
      required: [true, 'Validity start date is required'],
    },
    validityEnd: {
      type: Date,
      required: [true, 'Validity end date is required'],
      validate: {
        validator: function (value) {
          return value > this.validityStart;
        },
        message: 'Validity end date must be after start date',
      },
    },

    // Usage Limits
    usageLimit: {
      type: Number,
      required: [true, 'Usage limit is required'],
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },

    // Applicability
    applicableTo: {
      type: String,
      enum: ['all', 'car_type', 'car_id', 'user_id'],
      default: 'all',
    },
    carType: {
      type: String,
      trim: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
    },
    carIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
    }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Valid days of week (empty = all days)
    validDays: [{
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    }],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Description
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Created by admin
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
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validityStart: 1, validityEnd: 1 });
couponSchema.index({ applicableTo: 1, carType: 1 });
couponSchema.index({ isActive: 1, validityEnd: 1 });

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.usedCount < this.usageLimit &&
    now >= this.validityStart &&
    now <= this.validityEnd
  );
});

// Method to check if coupon can be applied
couponSchema.methods.canBeApplied = function (amount, carId, userId, carType) {
  const now = new Date();

  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, message: 'This coupon is not active' };
  }

  // Check if coupon has reached usage limit
  if (this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit' };
  }

  // Check validity dates
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (now < this.validityStart) {
    const startDate = formatDate(this.validityStart);
    return { valid: false, message: `This coupon is not yet valid. It will be available from ${startDate}` };
  }

  if (now > this.validityEnd) {
    const endDate = formatDate(this.validityEnd);
    return { valid: false, message: `This coupon has expired on ${endDate}` };
  }

  // Check valid days of week
  if (this.validDays && this.validDays.length > 0) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = daysOfWeek[now.getDay()];
    if (!this.validDays.includes(currentDay)) {
      const dayNamesMap = {
        'Sun': 'Sunday',
        'Mon': 'Monday',
        'Tue': 'Tuesday',
        'Wed': 'Wednesday',
        'Thu': 'Thursday',
        'Fri': 'Friday',
        'Sat': 'Saturday'
      };
      const fullDays = this.validDays.map(d => dayNamesMap[d] || d);
      return {
        valid: false,
        message: `This coupon is only valid on ${fullDays.join(', ')}`,
      };
    }
  }


  // Check minimum amount (only if set)
  if (this.minAmount > 0 && amount < this.minAmount) {
    return {
      valid: false,
      message: `Minimum amount of ₹${this.minAmount} required to apply this coupon`,
    };
  }

  // Check applicability
  if (this.applicableTo === 'car_type' && carType !== this.carType) {
    return {
      valid: false,
      message: `This coupon is only applicable to ${this.carType} cars`,
    };
  }

  if (this.applicableTo === 'car_id') {
    // Check if carIds array exists and has items
    if (this.carIds && Array.isArray(this.carIds) && this.carIds.length > 0) {
      // Check if the booking car is in the carIds array
      const carIdStr = carId?.toString();
      const isCarInList = this.carIds.some(id => id?.toString() === carIdStr);
      if (!isCarInList) {
        return {
          valid: false,
          message: 'This coupon is not applicable to this car',
        };
      }
    }
    // If carIds is empty, coupon applies to all cars (no restriction)
  }

  if (this.applicableTo === 'user_id' && userId?.toString() !== this.userId?.toString()) {
    return {
      valid: false,
      message: 'This coupon is not applicable to your account',
    };
  }

  return { valid: true };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    // Apply max discount if specified
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
    // Ensure discount doesn't exceed the amount
    if (discount > amount) {
      discount = amount;
    }
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Method to increment usage count
couponSchema.methods.incrementUsage = async function () {
  if (this.usedCount < this.usageLimit) {
    this.usedCount += 1;
    await this.save();
    return true;
  }
  return false;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;

