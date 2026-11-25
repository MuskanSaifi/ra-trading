import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    rating: Number,
    review: String,
    photo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
