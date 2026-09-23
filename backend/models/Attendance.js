import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        inTime: {
            type: String, // format "HH:mm AM/PM"
        },
        outTime: {
            type: String,
        },
        workHours: {
            type: String, // e.g., "8h 30m"
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
            default: 'Present',
        },
        note: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

// Ensure one record per staff per day
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
