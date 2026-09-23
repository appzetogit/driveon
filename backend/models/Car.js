import mongoose from 'mongoose';

/**
 * Car Schema
 * Complete car model for DriveOn car rental platform
 */
const carSchema = new mongoose.Schema(
  {
    // Basic Information
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    color: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Car Type & Category
    carType: {
      type: String,
      enum: ['sedan', 'suv', 'hatchback', 'luxury', 'sports', 'compact', 'muv', 'coupe'],
      required: [true, 'Car type is required'],
      index: true,
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'petrol_cng'],
      required: [true, 'Fuel type is required'],
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'cvt'],
      required: [true, 'Transmission type is required'],
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [2, 'Seating capacity must be at least 2'],
      max: [10, 'Seating capacity cannot exceed 10'],
    },

    // Pricing
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    pricePerWeek: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    pricePerMonth: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: [0, 'Security deposit cannot be negative'],
    },

    // Location & Availability
    location: {
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        index: true,
      },
      state: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
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
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    availableFrom: {
      type: Date,
    },
    availableTo: {
      type: Date,
    },

    // Owner Information
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    ownerInfo: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
      ownerId: {
        type: String,
        trim: true,
        index: true,
      }
    },
    vendorSettlement: {
      agreedAmount: {
        type: Number,
        min: [0, 'Agreed amount cannot be negative'],
        default: 0,
      },
      notes: {
        type: String,
        trim: true,
      },
      updatedAt: {
        type: Date,
      },
    },

    // Images
    images: [{
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
    }],

    // Features & Specifications
    features: [{
      type: String,
      enum: [
        'AC', 'GPS', 'Bluetooth', 'USB Charging', 'Reverse Camera',
        'Parking Sensors', 'Sunroof', 'Leather Seats', 'Keyless Entry',
        'Push Start', 'Airbags', 'ABS', 'Cruise Control', 'Music System',
        'Power Windows', 'Power Steering', 'Fog Lights', 'Alloy Wheels',
      ],
    }],
    mileage: {
      type: Number,
      min: [0, 'Mileage cannot be negative'],
    },
    engineCapacity: {
      type: String,
      trim: true,
    },

    // Status & Approval
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },

    // Ratings & Reviews
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: [0, 'Total bookings cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },

    // Additional Information
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    insurance: {
      valid: {
        type: Boolean,
        default: false,
      },
      expiryDate: {
        type: Date,
      },
      documentUrl: {
        type: String,
      },
    },
    pollutionCertificate: {
      valid: {
        type: Boolean,
        default: false,
      },
      expiryDate: {
        type: Date,
      },
      documentUrl: {
        type: String,
      },
    },
    rcDocument: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },

    // Flags
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Metadata
    views: {
      type: Number,
      default: 0,
    },
    lastBookedAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['inward', 'outward'],
      default: 'inward',
      index: true,
    },
    outwardCarId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ location: { city: 1 } });
carSchema.index({ status: 1, isAvailable: 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ carType: 1, fuelType: 1 });
carSchema.index({ isFeatured: 1, status: 1 });
carSchema.index({ isPopular: 1, status: 1 });
carSchema.index({ createdAt: -1 });

// Virtual for primary image
carSchema.virtual('primaryImage').get(function () {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images[0]?.url || null);
});

// Method to get formatted car name
carSchema.methods.getFullName = function () {
  return `${this.brand} ${this.model}`;
};

// Method to check if car is available for booking
carSchema.methods.isAvailableForBooking = function (startDate, endDate) {
  if (!this.isAvailable || this.status !== 'active') {
    return false;
  }

  if (this.availableFrom && startDate < this.availableFrom) {
    return false;
  }

  if (this.availableTo && endDate > this.availableTo) {
    return false;
  }

  return true;
};

const Car = mongoose.model('Car', carSchema);

export default Car;

