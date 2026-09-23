import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientModel'
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ['User', 'Staff', 'Admin'],
        default: 'Staff'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'info',
        enum: ['info', 'success', 'warning', 'alert', 'enquiry_assigned', 'task_assigned', 'payment_received', 'salary_paid', 'broadcast']
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        enum: ['Enquiry', 'CRMTask', 'Booking', 'Expense', 'Salary']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        default: null
    },
    isSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
