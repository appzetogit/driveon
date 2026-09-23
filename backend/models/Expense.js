import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        description: {
            type: String,
            trim: true,
        },
        month: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// Middleware to automatically set month and year based on date
expenseSchema.pre('validate', function(next) {
    if (this.date) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const d = new Date(this.date);
        this.month = `${months[d.getMonth()]} ${d.getFullYear()}`;
        this.year = d.getFullYear();
    }
    next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
