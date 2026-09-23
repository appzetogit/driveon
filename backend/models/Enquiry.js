import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        carInterested: {
            type: mongoose.Schema.Types.Mixed, // Support both ObjectId and legacy string names
            trim: true,
        },
        source: {
            type: String,
            enum: ['Website', 'Referral', 'Walk-in', 'Facebook', 'Phone', 'Phone Call', 'Social Media', 'Other'],
            default: 'Walk-in',
        },
        status: {
            type: String,
            enum: ['New', 'In Progress', 'Follow-up', 'Converted', 'Closed'],
            default: 'New',
        },
        stage: {
            type: String,
            enum: ['Negotiation', 'Doc Verification', 'Test Drive Done', 'None'],
            default: 'None',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
        },
        note: {
            type: String,
            trim: true,
        },
        revenue: {
            type: Number,
            default: 0,
        },
        bookingId: {
            type: String, // Reference to actual booking if converted
        },
        reasonForClosing: {
            type: String,
            trim: true,
        },
        lastInteraction: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;
