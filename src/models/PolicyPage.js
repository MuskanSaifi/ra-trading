import mongoose from "mongoose";

const PolicyPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["privacy-policy", "terms-and-conditions", "refund-and-return-policy"],
      index: true,
    },
    title: { type: String, required: true },
    contentHtml: { type: String, default: "" },
    updatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminSetting" },
  },
  { timestamps: true }
);

export default mongoose.models.PolicyPage ||
  mongoose.model("PolicyPage", PolicyPageSchema);

