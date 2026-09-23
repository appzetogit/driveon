import mongoose from 'mongoose';

const advanceLoanSchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        repaidAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['Active', 'Closed'],
            default: 'Active',
        },
        dateTaken: {
            type: Date,
            default: Date.now,
        },
        repayments: [
            {
                amount: Number,
                date: { type: Date, default: Date.now },
                note: String
            }
        ]
    },
    {
        timestamps: true,
    }
);

const AdvanceLoan = mongoose.model('AdvanceLoan', advanceLoanSchema);

export default AdvanceLoan;
