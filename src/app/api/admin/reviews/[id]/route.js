import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Review from "@/models/Review";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminAuth } from "@/lib/authHelpers";

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================================
// 📌 GET Single Review
// ======================================
export const GET = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const review = await Review.findById(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, review });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

// ======================================
// 📌 PUT → Update Review
// ======================================
export const PUT = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "No review data provided" },
        { status: 400 }
      );
    }

    const updateData = JSON.parse(rawData);
    const file = formData.get("photo");

    // 🖼 If new photo uploaded → upload it
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

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

      updateData.photo = uploaded.secure_url;
    }

    // 🔄 Update review
    const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedReview) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

// ======================================
// 📌 DELETE Review
// ======================================
export const DELETE = requireAdminAuth(async (req, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Review.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
