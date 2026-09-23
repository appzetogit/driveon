import mongoose from 'mongoose';

/**
 * Banner Schema
 * Mongoose model to store dynamic advertising banners uploaded by the admin.
 */
const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    linkedCar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
