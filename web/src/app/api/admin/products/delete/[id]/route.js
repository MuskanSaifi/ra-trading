import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req, { params }) {
  const { id } = await params;

  try {
    await connectDB();

    // Find the product
    const product = await Product.findById(id);

    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔹 Delete images from Cloudinary
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
            console.log(`Deleted image from Cloudinary: ${img.public_id}`);
          } catch (err) {
            console.error(`Failed to delete Cloudinary image ${img.public_id}:`, err.message);
          }
        }
      }
    }

    // 🔹 Delete product from MongoDB
    await Product.findByIdAndDelete(id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product and images deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("DELETE API error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
