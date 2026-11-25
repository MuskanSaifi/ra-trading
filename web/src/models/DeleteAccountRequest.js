import mongoose from "mongoose"; // ✅ REQUIRED

const deleteAccountRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.DeleteAccountRequest ||
  mongoose.model("DeleteAccountRequest", deleteAccountRequestSchema);
