import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        feedback: {
            type: String,
            required: true,
        },
        reviewDate: {
            type: Date,
            default: Date.now,
        },
        reviewedBy: {
            type: String, // Or Ref: Admin
        }
    },
    {
        timestamps: true,
    }
);

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);

export default PerformanceReview;
