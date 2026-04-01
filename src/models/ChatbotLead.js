import mongoose from "mongoose";

const ChatbotLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    userType: { type: String, default: "" },
    productInterest: { type: String, default: "" },
    quantity: { type: String, default: "" },
    message: { type: String, default: "" },
    pagePath: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.ChatbotLead ||
  mongoose.model("ChatbotLead", ChatbotLeadSchema);

