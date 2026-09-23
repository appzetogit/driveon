import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        title: {
            type: String, // e.g., "Corporate Client: TechSys", "Vendor: Rajesh Motors"
            required: true,
        },
        type: {
            type: String,
            enum: ['Receivable', 'Payable'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Settled', 'Overdue'],
            default: 'Pending',
        },
        referenceId: {
            type: String, // Link to Booking, Vendor, etc.
        },
        remarks: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
