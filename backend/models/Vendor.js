import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['Car Provider', 'Fleet Partner', 'Driver Partner', 'Premium Partner'],
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        profileImage: {
            type: String, // Cloudinary URL
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Pending'],
            default: 'Active',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
        },
        balance: {
            amount: { type: Number, default: 0 },
            type: { type: String, enum: ['Due', 'Cr'], default: 'Due' }
        },
        activeCarsCount: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
