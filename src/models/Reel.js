import mongoose from "mongoose";

const ReelSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    title: { type: String, default: "" },
    video: {
      url: { type: String, required: true },
      public_id: { type: String, default: "" },
    },
    poster: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Reel || mongoose.model("Reel", ReelSchema);

