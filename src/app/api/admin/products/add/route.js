// ✅ api/admin/products/add/route.js

import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

// ✅ Slug helper
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ✅ Ensure Node.js runtime
export const runtime = "nodejs";

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Helper → Upload to cloudinary
async function uploadToCloudinary(buffer, folder = "products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();

    if (!formData.get("data")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing product data" }),
        { status: 400 }
      );
    }

    const data = JSON.parse(formData.get("data"));

    // ✅ Required validation
    if (!data.name || !data.category || !data.price) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "name, category, and price are required",
        }),
        { status: 400 }
      );
    }

    // ✅ Auto calculate salePrice
    const salePrice =
      data.salePrice
        ? Number(data.salePrice)
        : data.discount
        ? Number(data.price) - Number(data.discount)
        : Number(data.price);

    // ✅ Tags format
    const formattedTags =
      typeof data.tags === "string"
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : data.tags || [];

    // ✅ Create product
    const product = new Product({
      name: data.name,
      slug: slugify(data.name), // ✅ auto-slug
      description: data.description || "",

      // ✅ category = ObjectId
      category: data.category,
      
      sku: data.sku || "",

      // ✅ subCategory remains String
      subCategory: data.subCategory || "",

      // ✅ brand = ObjectId
      brand: data.brand || null,

      gender: data.gender || "Unisex",

      price: Number(data.price) || 0,
      discount: Number(data.discount) || 0,
      salePrice,

      stock: Number(data.stock) || 0,
      minOrder: Number(data.minOrder) || 1,
      codAvailable: data.codAvailable !== false,

      attributes: data.attributes || [],
      tags: formattedTags,

      images: [],

      isTrending: !!data.isTrending,
      isFeatured: !!data.isFeatured,
      isNewArrival: !!data.isNewArrival,

      season: data.season || "All",
      status: data.status || "active",

      publishDate: data.publishDate
        ? new Date(data.publishDate)
        : Date.now(),
    });

    // ✅ Upload images with validation
    const images = formData.getAll("images");

    // Limit number of images
    if (images.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Maximum 10 images allowed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    for (const img of images) {
      if (img && img.size > 0) {
        // Validate file
        const fileValidation = validateFile(img, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        });

        if (!fileValidation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: fileValidation.error }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const buffer = Buffer.from(await img.arrayBuffer());
        
        // Validate image buffer (check magic bytes)
        const bufferValidation = validateImageBuffer(buffer);
        if (!bufferValidation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: bufferValidation.error }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await uploadToCloudinary(buffer);

        product.images.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // ✅ Save product
    await product.save();

    return new Response(
      JSON.stringify({ success: true, product }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ Failed to add product:", err);

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
