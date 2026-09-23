import mongoose from 'mongoose';

const garageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
        },
        specialistIn: {
            type: String, // e.g., "Engine, Denting, Painting"
            trim: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
        logo: {
            type: String, // Cloudinary URL
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        }
    },
    {
        timestamps: true,
    }
);

const Garage = mongoose.model('Garage', garageSchema);

export default Garage;
