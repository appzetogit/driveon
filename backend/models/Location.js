import mongoose from 'mongoose';

/**
 * Location Schema
 * Stores real-time location updates for users and guarantors
 */
const locationSchema = new mongoose.Schema(
  {
    // User or Guarantor ID
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    
    // Type: 'user' or 'guarantor'
    userType: {
      type: String,
      enum: ['user', 'guarantor'],
      required: [true, 'User type is required'],
      index: true,
    },
    
    // Location coordinates
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    
    // GPS accuracy in meters
    accuracy: {
      type: Number,
      default: null,
    },
    
    // Speed in km/h (if available)
    speed: {
      type: Number,
      default: null,
    },
    
    // Heading/direction in degrees (0-360)
    heading: {
      type: Number,
      default: null,
    },
    
    // Altitude in meters (if available)
    altitude: {
      type: Number,
      default: null,
    },
    
    // Address (reverse geocoded)
    address: {
      type: String,
      default: '',
    },
    
    // Timestamp of location update
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Is this the latest location for this user?
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
locationSchema.index({ userId: 1, userType: 1, isLatest: 1 });
locationSchema.index({ userId: 1, userType: 1, timestamp: -1 });

// Before saving, mark previous latest location as not latest
locationSchema.pre('save', async function (next) {
  if (this.isLatest && this.isNew) {
    // Mark all previous locations for this user as not latest
    await mongoose.model('Location').updateMany(
      { userId: this.userId, userType: this.userType, isLatest: true },
      { isLatest: false }
    );
  }
  next();
});

const Location = mongoose.model('Location', locationSchema);

export default Location;

