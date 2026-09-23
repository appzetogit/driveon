import mongoose from 'mongoose';

/**
 * Guarantor Points Schema
 * Tracks points allocated to guarantors for each booking
 * Points = 10% of booking amount, divided equally among all guarantors
 */
const guarantorPointsSchema = new mongoose.Schema(
  {
    // Booking reference
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
      index: true,
    },

    // Guarantor user who received points
    guarantor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guarantor is required'],
      index: true,
    },

    // Guarantor request reference
    guarantorRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GuarantorRequest',
      required: false,
      index: true,
    },

    // Booking amount (at time of points allocation)
    bookingAmount: {
      type: Number,
      required: false,
    },

    // Total guarantor pool (10% of booking amount)
    totalPoolAmount: {
      type: Number,
      required: false,
    },

    // Number of guarantors at time of allocation
    totalGuarantors: {
      type: Number,
      required: false,
    },

    // Points allocated to this specific guarantor (negative for debit adjustments)
    pointsAllocated: {
      type: Number,
      required: true,
    },

    // Points status
    status: {
      type: String,
      enum: ['active', 'reversed', 'cancelled'],
      default: 'active',
      index: true,
    },

    // Reversal details (if points were reversed)
    reversedAt: {
      type: Date,
    },
    reversalReason: {
      type: String,
      trim: true,
    },

    // Booking status at time of allocation
    bookingStatusAtAllocation: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    },

    // Custom adjustment fields
    isAdjustment: {
      type: Boolean,
      default: false,
    },
    adjustmentType: {
      type: String,
      enum: ['credit', 'debit'],
    },
    reason: {
      type: String,
      trim: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
guarantorPointsSchema.index({ guarantor: 1, status: 1 });
guarantorPointsSchema.index({ booking: 1, status: 1 });

guarantorPointsSchema.index({ createdAt: -1 });

// Prevent duplicate points for same booking and guarantor (only for normal booking allocations, not adjustments)
guarantorPointsSchema.index(
  { booking: 1, guarantor: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { isAdjustment: false } 
  }
);

const GuarantorPoints = mongoose.model('GuarantorPoints', guarantorPointsSchema);

export default GuarantorPoints;

