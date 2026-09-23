import mongoose from 'mongoose';

const crmTaskSchema = new mongoose.Schema(
    {
        enquiryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Enquiry',
            required: false,
        },
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        time: {
            type: String, // e.g., "10:00 AM"
        },
        status: {
            type: String,
            enum: ['Pending', 'Done', 'Overdue'],
            default: 'Pending',
        },
        note: {
            type: String,
            trim: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
    },
    {
        timestamps: true,
    }
);

const CRMTask = mongoose.model('CRMTask', crmTaskSchema);

export default CRMTask;
