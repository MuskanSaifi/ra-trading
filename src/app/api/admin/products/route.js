import { NextResponse } from "next/server";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import { sanitizeSearchQuery, sanitizeInput, validateBodySize } from "@/lib/apiHelpers";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload buffer to Cloudinary
async function uploadToCloudinary(fileBuffer, folder = "products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
}

export const GET = requireAdminAuth(async (req) => {
  try {
    await connectDB();
    
    // Get pagination params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    // Limit max to 100 to prevent excessive data transfer
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50")), 100);
    const skip = (page - 1) * limit;
    
    // Sanitize search input to prevent ReDoS attacks
    const rawSearch = searchParams.get("search") || "";
    const search = sanitizeSearchQuery(rawSearch, 50);

    // Build query
    const query = {};
    // Only use regex if search is meaningful (length > 2) to prevent CPU spikes
    if (search && search.length > 2) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    } else if (search && search.length <= 2) {
      // For very short searches, use prefix match (more efficient)
      query.$or = [
        { name: { $regex: `^${search}`, $options: "i" } }
      ];
    }

    // Get total count
    const total = await Product.countDocuments(query);

    // Fetch products with pagination, lean, and field selection (reduces data transfer)
    const products = await Product.find(query)
      .select("name slug price salePrice discount images stock isTrending isFeatured isNewArrival category brand createdAt description")
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate low stock only if needed (optimize DB queries)
    const includeLowStock = searchParams.get("includeLowStock") === "true";
    let lowStock = 0;
    if (includeLowStock) {
      const LOW_STOCK_LIMIT = 5;
      lowStock = await Product.countDocuments({
        $or: [
          { stock: { $lt: LOW_STOCK_LIMIT } },
          { stock: { $exists: false } }
        ]
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        products, 
        total, 
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...(includeLowStock && { lowStock })
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate' // Admin data should not be cached
        }
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});


// ✅ POST -> Add product (without video)
export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();

    // Validate body size
    const dataString = formData.get("data");
    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Limit JSON size to prevent large payload attacks
    if (dataString.length > 10000) { // 10KB limit for product data
      return NextResponse.json(
        { success: false, error: "Request data too large" },
        { status: 413 }
      );
    }

    // Parse product JSON
    const productData = JSON.parse(dataString);
    
    // Validate body size
    try {
      validateBodySize(productData, 10000);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 413 }
      );
    }

    // Upload images with validation (max 10)
    const files = formData.getAll("images");
    
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 images allowed" },
        { status: 400 }
      );
    }

    const imageUrls = [];
    for (const file of files) {
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

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Validate image buffer (check magic bytes)
      const bufferValidation = validateImageBuffer(buffer);
      if (!bufferValidation.valid) {
        return NextResponse.json(
          { success: false, error: bufferValidation.error },
          { status: 400 }
        );
      }

      const url = await uploadToCloudinary(buffer, "products");
      imageUrls.push(url);
    }

    // Auto-calculate sale price if discount exists
    if (productData.price && productData.discount) {
      productData.salePrice =
        productData.price - (productData.price * productData.discount) / 100;
    }

    // Convert tags string -> array
    if (productData.tags && typeof productData.tags === "string") {
      productData.tags = productData.tags.split(",").map((t) => t.trim());
    }

    // Add Cloudinary media URLs
    productData.images = imageUrls;

    // Save to MongoDB
    const product = await Product.create(productData);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("❌ Error adding product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
