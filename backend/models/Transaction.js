import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['Cash In', 'Cash Out'],
            required: true,
        },
        category: {
            type: String,
            enum: ['Rental', 'Commission', 'Penalty', 'Fuel', 'Maintenance', 'Salary', 'Payout', 'Refund', 'Other'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['UPI', 'CASH', 'BANK TRANSFER', 'CARD'],
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        referenceId: {
            type: String, // e.g., Booking ID, Transaction ID
        },
        date: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
