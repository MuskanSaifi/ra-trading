import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,      // ✅ Slug must be unique
      lowercase: true,
      trim: true,
    },
    description: String,
    pageTitle: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    contentHtml: { type: String, default: "<p></p>" },
    image: {
      url: String,
      public_id: String, // cloudinary public id
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model("Category", CategorySchema);
