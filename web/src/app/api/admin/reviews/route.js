import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import Review from "@/models/Review";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

// 🔹 Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================================
// 📌 GET → Get All Reviews
// ======================================
export const GET = requireAdminAuth(async (req) => {
  try {
    await connectDB();
    
    // Get pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Review.countDocuments();

    // Fetch reviews with pagination and lean
    // Note: Review model doesn't have productId/userId fields, so no populate needed
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true, 
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
});

// ======================================
// 📌 POST → Create Review
// ======================================
export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "No review data provided" },
        { status: 400 }
      );
    }

    const reviewData = JSON.parse(rawData);
    let photoUrl = null;

    const file = formData.get("photo");

    // 🔥 Upload image if exists with validation
    if (file && file.size > 0) {
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

      // Validate image buffer
      const bufferValidation = validateImageBuffer(buffer);
      if (!bufferValidation.valid) {
        return NextResponse.json(
          { success: false, error: bufferValidation.error },
          { status: 400 }
        );
      }

      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "reviews" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      photoUrl = uploaded.secure_url;
    }

    // Add photo url if uploaded
    if (photoUrl) reviewData.photo = photoUrl;

    const newReview = await Review.create(reviewData);

    return NextResponse.json({ success: true, review: newReview });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
});
