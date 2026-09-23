import mongoose from 'mongoose';

const carExpenseSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        type: {
            type: String,
            enum: ['Fuel', 'Maintenance', 'Insurance', 'Repair', 'Other'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        garage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage', // Relevant if type is Maintenance or Repair
        },
        description: {
            type: String,
            trim: true,
        },
        odometerReading: {
            type: Number, // Useful for fuel/maintenance tracking
        }
    },
    {
        timestamps: true,
    }
);

const CarExpense = mongoose.model('CarExpense', carExpenseSchema);

export default CarExpense;
