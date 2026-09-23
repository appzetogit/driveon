import mongoose from 'mongoose';

/**
 * Guarantor Request Schema
 * Stores requests sent by admin to guarantors for specific bookings
 */
const guarantorRequestSchema = new mongoose.Schema(
  {
    // Booking reference
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
      index: true,
    },
    
    // User who made the booking (needs guarantor)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    
    // Guarantor user (who will be the guarantor)
    guarantor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guarantor is required'],
      index: true,
    },
    
    // Admin who sent the request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    
    // Request status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    
    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      trim: true,
    },
    
    // Dates
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
guarantorRequestSchema.index({ user: 1, status: 1 });
guarantorRequestSchema.index({ guarantor: 1, status: 1 });
guarantorRequestSchema.index({ booking: 1, status: 1 });
guarantorRequestSchema.index({ createdAt: -1 });

// Prevent duplicate pending requests for same booking and guarantor
guarantorRequestSchema.index({ booking: 1, guarantor: 1, status: 1 }, { unique: true, sparse: true });

const GuarantorRequest = mongoose.model('GuarantorRequest', guarantorRequestSchema);

export default GuarantorRequest;

