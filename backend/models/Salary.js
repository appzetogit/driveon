import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        month: {
            type: String, // e.g., "December 2025"
            required: true,
        },
        baseSalary: {
            type: Number,
            required: true,
        },
        deductions: {
            type: Number,
            default: 0,
        },
        bonus: {
            type: Number,
            default: 0,
        },
        note: {
            type: String,
            default: '',
        },
        netPay: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['Paid', 'Pending', 'Processing'],
            default: 'Pending',
        },
        paidDate: {
            type: Date,
        },
        advanceAmount: {
            type: Number,
            default: 0,
        },
        transactions: [{
            transactionId: {
                type: String,
                required: true,
            },
            razorpayOrderId: {
                type: String,
            },
            razorpayPaymentId: {
                type: String,
            },
            razorpaySignature: {
                type: String,
            },
            amount: {
                type: Number,
                required: true,
            },
            status: {
                type: String,
                enum: ['pending', 'success', 'failed'],
                default: 'pending',
            },
            paymentMethod: {
                type: String,
                enum: ['razorpay', 'manual', 'bank_transfer'],
                default: 'razorpay',
            },
            bankName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String },
            upiId: { type: String },
            paymentDate: {
                type: Date,
            }
        }]
    },
    {
        timestamps: true,
    }
);

const Salary = mongoose.model('Salary', salarySchema);

export default Salary;
