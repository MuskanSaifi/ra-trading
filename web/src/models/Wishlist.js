import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ✅ हर user + product pair सिर्फ 1 बार रहे
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);

export default Wishlist;
