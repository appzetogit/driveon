import mongoose from 'mongoose';

/**
 * Add-On Service Schema
 * Represents a single add-on service that can be dynamically priced and has service providers (e.g., Drivers).
 */
const addOnServicesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    key: {
      type: String,
      required: [true, 'Service key is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    providers: [
      {
        name: {
          type: String,
          required: [true, 'Provider name is required'],
          trim: true,
        },
        phone: {
          type: String,
          required: [true, 'Provider phone is required'],
          trim: true,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        address: {
          type: String,
          trim: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    singleUnitOnly: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create static method to return standard prices mapping for backward compatibility
addOnServicesSchema.statics.getPrices = async function () {
  const services = await this.find();
  const pricesObj = {};
  services.forEach(s => {
    pricesObj[s.key] = s.price;
  });
  return pricesObj;
};

// Create static method to bulk update prices using standard format
addOnServicesSchema.statics.updatePrices = async function (newPrices) {
  for (const [key, price] of Object.entries(newPrices)) {
    await this.findOneAndUpdate(
      { key },
      { price: parseFloat(price) || 0 },
      { new: true, upsert: true }
    );
  }
  return await this.getPrices();
};

const AddOnServices = mongoose.model('AddOnServices', addOnServicesSchema);

export default AddOnServices;


