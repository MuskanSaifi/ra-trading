import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,      // ✅ Slug must be unique
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    pageTitle: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    contentHtml: { type: String, default: "<p></p>" },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

if (mongoose.models.Brand) {
  delete mongoose.models.Brand;
}

export default mongoose.model("Brand", BrandSchema);