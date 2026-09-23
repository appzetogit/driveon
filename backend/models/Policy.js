import mongoose from 'mongoose';

/**
 * Policy Schema
 * Stores customizable legal text pages like Privacy Policy, Terms & Conditions, Cancellation & Refund Policy
 */
const policySchema = new mongoose.Schema(
  {
    // Unique key identifier (e.g., 'privacy_policy', 'terms_conditions', 'cancellation_refund')
    key: {
      type: String,
      required: [true, 'Policy key is required'],
      unique: true,
      index: true,
    },
    
    // Display Title
    title: {
      type: String,
      required: [true, 'Policy title is required'],
    },
    
    // Text Content (Markdown / plain text formatted)
    content: {
      type: String,
      required: [true, 'Policy content is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.model('Policy', policySchema);

export default Policy;
