import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: false, // Will be set in pre-save hook
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "general",
        "booking",
        "payment",
        "technical",
        "kyc",
        "guarantor",
        "other",
      ],
      default: "general",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "pending", "in_progress", "resolved", "closed"],
      default: "open",
    },
    messages: [messageSchema],
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

supportTicketSchema.index({ category: 1 });

// Generate unique token before saving
supportTicketSchema.pre("save", async function (next) {
  try {
    // Generate token if it doesn't exist (always for new documents, or if missing)
    if (!this.token) {
      // Generate a unique token using timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase();
      const randomNum = Math.floor(Math.random() * 10000);
      this.token = `TK-${timestamp}-${randomStr}-${randomNum}`;
    }

    // Update resolvedAt when status changes to resolved
    if (this.isModified("status")) {
      if (this.status === "resolved" && !this.resolvedAt) {
        this.resolvedAt = new Date();
      }
      if (this.status === "closed" && !this.closedAt) {
        this.closedAt = new Date();
      }
    }

    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
