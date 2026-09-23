import mongoose from 'mongoose';

const carDocumentSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        docName: {
            type: String, // e.g., "Insurance Policy"
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['Insurance', 'PUC', 'RC', 'Fitness', 'Permit', 'Other'],
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        documentUrl: {
            type: String, // Cloudinary URL
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
        },
        status: {
            type: String,
            enum: ['Valid', 'Expiring Soon', 'Expired'],
            default: 'Valid',
        }
    },
    {
        timestamps: true,
    }
);

const CarDocument = mongoose.model('CarDocument', carDocumentSchema);

export default CarDocument;
