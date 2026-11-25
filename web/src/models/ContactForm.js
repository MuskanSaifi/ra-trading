import mongoose from "mongoose";

const ContactFormSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Correct way — NO hyphen in model name
export default mongoose.models.ContactForm ||
  mongoose.model("ContactForm", ContactFormSchema);
