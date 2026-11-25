import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.FAQ || mongoose.model("FAQ", FAQSchema);
