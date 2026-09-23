import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            unique: true,
        },
        name: {
            type: String,
            required: [true, 'Staff name is required'],
            trim: true,
        },
        role: {
            type: String,
            required: [true, 'Role is required'],
            trim: true,
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            enum: ['Sales', 'Fleet', 'Garage', 'Administration', 'Finance'],
            default: 'Sales',
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            //select: false, // Do not return password by default
        },
        plainTextPassword: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Active', 'On Duty', 'Leave', 'Inactive'],
            default: 'Active',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        joinDate: {
            type: Date,
            default: Date.now,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        employmentType: {
            type: String,
            default: 'Full Time',
        },
        avatar: {
            type: String,
            default: '',
        },
        aadharCard: {
            type: String,
            default: '',
        },
        salary: {
            type: Number,
            default: 0,
        },
        salaryMethod: {
            type: String,
            enum: ['Monthly', 'Daily', 'Per Trip'],
            default: 'Monthly',
        },
        workingDays: {
            type: Number,
            default: 0,
        },
        absentDeduction: {
            type: Number,
            default: 0,
        },
        halfDayDeduction: {
            type: Number,
            default: 0,
        },
        overtimeRate: {
            type: Number,
            default: 0,
        },
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
            lastLocationUpdate: Date,
        },
        fcmToken: {
            type: String,
            default: null,
        },
        fcmTokenMobile: {
            type: String,
            default: null,
        },
        insuranceNote: {
            type: String,
            default: '',
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    {
        timestamps: true,
    }
);

// Encrypt password using bcrypt
staffSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
staffSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

staffSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
