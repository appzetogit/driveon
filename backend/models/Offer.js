import mongoose from 'mongoose';

/**
 * Offer Schema
 * Stores promotional offers and discounts including first-time user and fully free campaigns
 */
const offerSchema = new mongoose.Schema(
  {
    // Offer Title (e.g. "Welcome First Time Free")
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
    },

    // Unique Offer Code (e.g. "WELCOMEFREE")
    code: {
      type: String,
      required: [true, 'Offer code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Description of the offer
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Discount Details
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: function () {
        return this.discountType !== 'free';
      },
      min: [0, 'Discount value cannot be negative'],
    },

    // Restrictions
    isFirstTimeOnly: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Valid days of week (empty = all days)
    validDays: [{
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    }],


    // Expiry and Validity
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

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Index for active queries within date range
offerSchema.index({ code: 1, isActive: 1 });
offerSchema.index({ validityStart: 1, validityEnd: 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
