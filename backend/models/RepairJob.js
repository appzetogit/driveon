import mongoose from 'mongoose';

const repairJobSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        garage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage',
            required: true,
        },
        serviceType: {
            type: String, // e.g., "Brake Pad Replacement"
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        issues: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ['Pending', 'Diagnostics', 'Repair', 'Testing', 'Completed', 'Cancelled'],
            default: 'Pending',
            index: true,
        },
        progress: {
            type: Number, // 0 to 100
            default: 0,
        },
        estimatedCompletion: {
            type: Date,
        },
        cost: {
            type: Number,
            default: 0,
        },
        completedAt: {
            type: Date,
        },
        assignedStaff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
        }
    },
    {
        timestamps: true,
    }
);

const RepairJob = mongoose.model('RepairJob', repairJobSchema);

export default RepairJob;
