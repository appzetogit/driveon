import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
    {
        cityName: {
            type: String,
            required: [true, 'City name is required'],
            trim: true,
        },
        state: {
            type: String,
            required: [true, 'State/UT is required'],
            trim: true,
        },
        numberOfHubs: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const City = mongoose.model('City', citySchema);

export default City;
