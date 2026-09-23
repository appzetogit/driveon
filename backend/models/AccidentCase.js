import mongoose from 'mongoose';

const accidentCaseSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        incidentDate: {
            type: Date,
            required: true,
        },
        incidentLocation: {
            type: String,
            required: true,
            trim: true,
        },
        driverName: {
            type: String,
            required: true,
            trim: true,
        },
        driverLicenseNo: {
            type: String,
            required: true,
            trim: true,
        },
        severity: {
            type: String,
            enum: ['Minor', 'Medium', 'Major'],
            required: true,
        },
        estimatedCost: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            trim: true,
        },
        evidence: [
            {
                url: String,
                publicId: String
            }
        ],
        status: {
            type: String,
            enum: ['Active', 'Settled', 'Full Recovery'],
            default: 'Active',
            index: true,
        },
        // Settlement Details
        finalCost: {
            type: Number,
            default: 0,
        },
        recoveredAmount: {
            type: Number,
            default: 0,
        },
        netLoss: {
            type: Number,
            default: 0,
        },
        settledAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

// Middleware to calculate net loss before saving
accidentCaseSchema.pre('save', function (next) {
    if (this.status !== 'Active') {
        this.netLoss = Math.max(0, this.finalCost - this.recoveredAmount);
    }
    next();
});

const AccidentCase = mongoose.model('AccidentCase', accidentCaseSchema);

export default AccidentCase;
