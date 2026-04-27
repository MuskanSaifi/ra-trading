import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, index: true }, // Index for faster searches
    slug: { type: String, unique: true, required: true, index: true },
    description: { type: String },
    sku: { type: String, index: true },

    // ✅ category → ObjectId
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    
    // ✅ ⛔ DO NOT CHANGE — subCategory remains STRING
    subCategory: { type: String }, // ✅ you asked to keep it same

    // ✅ brand → ObjectId
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      default: "Unisex",
    },

    // Pricing
    price: { type: Number, required: true, index: true }, // Index for price filtering
    discount: { type: Number, default: 0 },
    salePrice: { type: Number },

    // Inventory
    stock: { type: Number, default: 0 },
    minOrder: { type: Number, default: 1 },
    /** When false, checkout hides COD for orders containing this product */
    codAvailable: { type: Boolean, default: true },

    // Display
    /** Background color behind product images on website */
    imageBgColor: { type: String, default: "#ffffff" },

    // Attributes
    attributes: [
      {
        name: { type: String },
        value: { type: String },
      },
    ],

    // Media
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],

    // SEO / Tags
    tags: [{ type: String }],

    // Flags
    isTrending: { type: Boolean, default: false, index: true }, // Index for flag filtering
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    season: { type: String, default: "All" },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    publishDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create compound indexes for common query patterns (optimizes CPU usage)
ProductSchema.index({ category: 1, price: 1 }); // For category + price filtering
ProductSchema.index({ isTrending: 1, createdAt: -1 }); // For trending products
ProductSchema.index({ isFeatured: 1, createdAt: -1 }); // For featured products
ProductSchema.index({ isNewArrival: 1, createdAt: -1 }); // For new arrivals
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search index (more efficient than regex)
ProductSchema.index({ stock: 1 }); // For stock queries
ProductSchema.index({ status: 1, createdAt: -1 }); // For store listings
ProductSchema.index({ category: 1, status: 1, createdAt: -1 }); // For category listings

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
