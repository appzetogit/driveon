import mongoose from 'mongoose';

/**
 * Booking Schema
 * Complete booking model for DriveOn car rental platform
 */
const bookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingId: {
      type: String,
      unique: true,
      required: false, // Will be auto-generated in pre-save hook
      index: true,
    },

    // User & Car Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: [true, 'Car is required'],
      index: true,
    },
    guarantor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
      index: true,
    },

    // Trip Details
    tripStart: {
      location: {
        type: String,
        required: [true, 'Trip start location is required'],
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
      date: {
        type: Date,
        required: [true, 'Trip start date is required'],
      },
      time: {
        type: String,
        required: [true, 'Trip start time is required'],
      },
    },
    tripEnd: {
      location: {
        type: String,
        required: [true, 'Trip end location is required'],
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
      date: {
        type: Date,
        required: [true, 'Trip end date is required'],
      },
      time: {
        type: String,
        required: [true, 'Trip end time is required'],
      },
    },

    // Duration
    totalDays: {
      type: Number,
      required: true,
      min: [1, 'Minimum booking duration is 1 day'],
    },

    // Pricing Details
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: [0, 'Base price cannot be negative'],
      },
      totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative'],
      },
      advancePayment: {
        type: Number,
        default: 0,
        min: [0, 'Advance payment cannot be negative'],
      },
      remainingPayment: {
        type: Number,
        default: 0,
        min: [0, 'Remaining payment cannot be negative'],
      },
      weekendMultiplier: {
        type: Number,
        default: 0,
      },
      holidayMultiplier: {
        type: Number,
        default: 0,
      },
      timeOfDayMultiplier: {
        type: Number,
        default: 0,
      },
      demandSurge: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      couponCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      offerCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      offerDiscount: {
        type: Number,
        default: 0,
      },
      finalPrice: {
        type: Number,
        required: true,
        min: [0, 'Final price cannot be negative'],
      },
      addOnServicesTotal: {
        type: Number,
        default: 0,
        min: [0, 'Add-on services total cannot be negative'],
      },
      pointsUsed: {
        type: Number,
        default: 0,
      },
      pointsDiscount: {
        type: Number,
        default: 0,
      },
    },

    // Add-On Services (Optional)
    addOnServices: {
      type: new mongoose.Schema(
        {
          driver: {
            type: Number,
            default: 0,
            min: [0, 'Driver quantity cannot be negative'],
          },
          bodyguard: {
            type: Number,
            default: 0,
            min: [0, 'Bodyguard quantity cannot be negative'],
          },
          gunmen: {
            type: Number,
            default: 0,
            min: [0, 'Gunmen quantity cannot be negative'],
          },
          bouncer: {
            type: Number,
            default: 0,
            min: [0, 'Bouncer quantity cannot be negative'],
          },
        },
        { strict: false, _id: false }
      ),
      default: {},
    },

    // Payment Information
    paymentOption: {
      type: String,
      enum: ['full', 'advance'],
      required: [true, 'Payment option is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },

    // Transaction Details
    transactions: [{
      transactionId: {
        type: String,
        required: true,
      },
      phonePeTransactionId: {
        type: String,
      },
      razorpayOrderId: {
        type: String,
      },
      razorpayPaymentId: {
        type: String,
      },
      razorpaySignature: {
        type: String,
      },
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
      },
      paymentMethod: {
        type: String,
        enum: ['phonepe', 'razorpay', 'stripe', 'cash', 'online'],
        default: 'razorpay',
      },
      receivedBy: {
        type: String,
        trim: true,
      },
      paymentDate: {
        type: Date,
      },
      refundDate: {
        type: Date,
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
    }],

    // Booking Status
    status: {
      type: String,
      enum: ['unpaid', 'pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'],
      default: 'unpaid',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'owner', 'admin', 'system'],
    },
    cancelledAt: {
      type: Date,
    },

    // Trip Status
    tripStatus: {
      type: String,
      enum: ['not_started', 'started', 'picked_up', 'ongoing', 'in_progress', 'completed', 'cancelled'],
      default: 'not_started',
      index: true,
    },
    tripStartedAt: {
      type: Date,
    },
    tripEndedAt: {
      type: Date,
    },

    // Location Tracking
    isTrackingActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    trackingStartedAt: {
      type: Date,
    },
    trackingEndedAt: {
      type: Date,
    },
    lastLocationUpdate: {
      type: Date,
    },
    currentLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
      },
      updatedAt: {
        type: Date,
      },
    },

    // Special Requests
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
    },

    // Additional Information
    notes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },

    // Ratings & Reviews
    userRating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    userReview: {
      type: String,
      trim: true,
    },
    ownerRating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    ownerReview: {
      type: String,
      trim: true,
    },

    // Metadata
    bookingDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique booking ID before validation
// Using pre('validate') ensures bookingId is set before required field validation
bookingSchema.pre('validate', async function (next) {
  try {
    // Always generate bookingId for new documents if not already set
    if (this.isNew && !this.bookingId) {
      let bookingId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      // Try to generate a unique bookingId
      while (!isUnique && attempts < maxAttempts) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        bookingId = `BK${timestamp}${random}`;

        // Check if this bookingId already exists
        const existing = await mongoose.model('Booking').findOne({ bookingId });
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
          // Add more randomness if collision occurs
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // If still not unique after max attempts, use timestamp-based ID
      if (!isUnique) {
        bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      this.bookingId = bookingId;
      console.log('✅ Generated bookingId in pre-validate hook:', this.bookingId);
    }
    next();
  } catch (error) {
    console.error('❌ Error in pre-validate hook for bookingId:', error);
    next(error);
  }
});

// Indexes for better query performance
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ car: 1, status: 1 });
bookingSchema.index({ status: 1, tripStatus: 1 });
bookingSchema.index({ isTrackingActive: 1, tripStatus: 1 });
bookingSchema.index({ 'tripStart.date': 1, 'tripEnd.date': 1 });
bookingSchema.index({ bookingDate: -1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for formatted booking display
bookingSchema.virtual('formattedBookingId').get(function () {
  return this.bookingId;
});

// Method to check if booking is active
bookingSchema.methods.isActive = function () {
  return this.status === 'active' && this.tripStatus === 'in_progress';
};

// Method to check if tracking should be active
bookingSchema.methods.shouldTrack = function () {
  const now = new Date();
  const tripStart = new Date(this.tripStart.date);
  const tripEnd = new Date(this.tripEnd.date);

  return (
    this.status === 'confirmed' &&
    this.tripStatus !== 'completed' &&
    this.tripStatus !== 'cancelled' &&
    now >= tripStart &&
    now <= tripEnd
  );
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

