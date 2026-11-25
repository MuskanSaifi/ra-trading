import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // For admin notifications
    forAdmin: {
      type: Boolean,
      default: false,
    },
    
    // For user notifications
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    // Notification details
    title: {
      type: String,
      required: true,
    },
    
    message: {
      type: String,
      required: true,
    },
    
    type: {
      type: String,
      enum: ["order", "product", "user", "system", "alert", "info"],
      default: "info",
    },
    
    // Related data (orderId, productId, etc.)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    
    relatedType: {
      type: String, // "order", "product", "user", etc.
      default: null,
    },
    
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    
    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    
    // Action link (optional)
    actionUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ forAdmin: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
