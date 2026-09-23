import mongoose from 'mongoose';

const staffWorkTaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Pending', 'Done'],
            default: 'Pending',
        },
        description: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const StaffWorkTask = mongoose.model('StaffWorkTask', staffWorkTaskSchema);

export default StaffWorkTask;
