import { NextResponse } from "next/server";
import Product from "@/models/Product";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

export const runtime = "nodejs";

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Slug helper
const slugify = (text) =>
  text
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ✅ Upload buffer → Cloudinary
async function uploadToCloudinary(fileBuffer, folder = "products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(fileBuffer);
  });
}

/* ===========================
 ✅ GET → Single Product
=========================== */
export const GET = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const product = await Product.findById(id);

    if (!product)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (err) {
    console.error("GET ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

/* ===========================
 ✅ PUT → Update Product
=========================== */
export const PUT = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const productData = JSON.parse(formData.get("data"));

    // ✅ Generate slug if name changed
    if (productData.name) {
      productData.slug = slugify(productData.name);
    }

    // ✅ sale price auto
    const price = Number(productData.price) || 0;
    const discount = Number(productData.discount) || 0;
    productData.salePrice = price - (price * discount) / 100;

    // ✅ tags string → array
    if (productData.tags && typeof productData.tags === "string") {
      productData.tags = productData.tags.split(",").map((t) => t.trim());
    }

    // ✅ Display defaults
    if (productData.imageBgColor == null || productData.imageBgColor === "") {
      productData.imageBgColor = "#ffffff";
    }

    const { id } = await params;
    
    // ✅ Fetch existing
    const existingProduct = await Product.findById(id);

    if (!existingProduct)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );

    /* =========================
      ✅ Image Handling
    ========================== */

    // Incoming reference URLs (keep)
    const existingImages = JSON.parse(formData.get("existingImages") || "[]");

    // Delete removed images from Cloudinary
    const imagesToDelete = existingProduct.images.filter(
      (img) => !existingImages.includes(img.url)
    );

    for (const img of imagesToDelete) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    // ✅ New image upload with validation
    const newFiles = formData.getAll("images");
    
    // Limit total images (existing + new)
    const totalImages = existingImages.length + newFiles.length;
    if (totalImages > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 images allowed per product" },
        { status: 400 }
      );
    }

    const newImages = [];

    for (const file of newFiles) {
      if (file && file.name && file.size > 0) {
        // Validate file
        const fileValidation = validateFile(file, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        });

        if (!fileValidation.valid) {
          return NextResponse.json(
            { success: false, error: fileValidation.error },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Validate image buffer (check magic bytes)
        const bufferValidation = validateImageBuffer(buffer);
        if (!bufferValidation.valid) {
          return NextResponse.json(
            { success: false, error: bufferValidation.error },
            { status: 400 }
          );
        }

        const upload = await uploadToCloudinary(buffer, "products");
        newImages.push({ url: upload.secure_url, public_id: upload.public_id });
      }
    }

    // ✅ Final Image Array
    productData.images = [
      ...existingProduct.images.filter((img) =>
        existingImages.includes(img.url)
      ),
      ...newImages,
    ];

    // ✅ Update and return
    const updated = await Product.findByIdAndUpdate(id, productData, {
      new: true,
    });

    return NextResponse.json({ success: true, product: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

/* ===========================
 ✅ DELETE → Remove Product
=========================== */
export const DELETE = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const existingProduct = await Product.findById(id);
    if (!existingProduct)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );

    // ✅ Delete Cloudinary media
    for (const img of existingProduct.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
