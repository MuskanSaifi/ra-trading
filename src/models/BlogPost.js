import mongoose from "mongoose";

const blockTypes = ["h1", "h2", "h3", "h4", "h5", "p", "ul", "img"];

const BlogBlockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: blockTypes, required: true },
    text: { type: String, default: "" },
    items: [{ type: String }],
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: true }
);

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: "" },
    author: { type: String, default: "Admin" },
    category: { type: String, default: "" },
    tags: [{ type: String }],
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    banner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    /** Rich HTML from Tiptap (primary body). */
    contentHtml: { type: String, default: "" },
    /** Legacy block-based content (older posts). */
    blocks: [BlogBlockSchema],
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);
