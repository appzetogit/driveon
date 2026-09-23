import mongoose from 'mongoose';

const vendorHistorySchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        action: {
            type: String, // e.g., "Partnered", "Fleet Update", "Payout"
            required: true,
        },
        detail: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            // Status depends on action, e.g., "Verified", "Active", "Completed"
        }
    },
    {
        timestamps: true,
    }
);

const VendorHistory = mongoose.model('VendorHistory', vendorHistorySchema);

export default VendorHistory;
