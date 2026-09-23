import mongoose from 'mongoose';

const outwardBookingSchema = new mongoose.Schema(
  {
    originalBookingId: {
      type: String, // e.g. fleet_booking_timestamp
      required: true,
      unique: true
    },
    carId: {
      type: String, // originalOutputId
      required: true,
    },
    carName: {
      type: String,
      required: true,
    },
    carType: {
      type: String,
    },
    carOwnerName: {
      type: String,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    customerImage: {
      type: String,
    },
    licenseImage: {
      type: String,
    },
    aadhaarImage: {
      type: String,
    },
    fromDate: {
      type: String, // ISO date string
      required: true,
    },
    startTime: {
      type: String, // start time
    },
    toDate: {
      type: String, // ISO date string
      required: true,
    },
    endTime: {
      type: String, // end time
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      default: 'pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    advancePaymentMode: {
      type: String,
    },
    remainingPaymentMode: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
    transactionId: {
      type: String,
    },
    aadhaarNumber: {
      type: String,
    },
    aadhaarVerified: {
      type: Boolean,
      default: false,
    },
    licenseNumber: {
      type: String,
    },
    licenseVerified: {
      type: Boolean,
      default: false,
    },
    panNumber: {
      type: String,
    },
    panVerified: {
      type: Boolean,
      default: false,
    },
    deposit: {
      type: Number,
      default: 0,
    },
    cashCollector: {
      type: String,
      default: '',
    },
    advanceCashCollector: {
      type: String,
      default: '',
    },
    remainingCashCollector: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    }
  },
  {
    timestamps: true,
  }
);

const OutwardBooking = mongoose.model('OutwardBooking', outwardBookingSchema);

export default OutwardBooking;
