import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import Banner from "@/models/Sections";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

// ✅ GET → All Banners
export async function GET() {
  try {
    await connectDB();
    // Sort by last edited so storefront uses latest configured content
    const banners = await Banner.find().sort({ updatedAt: -1, createdAt: -1 }).lean();

    return jsonResponse(
      { success: true, banners },
      200,
      {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    );
  } catch (err) {
    console.error("Sections GET Error:", err);
    return jsonResponse(
      { success: false, error: err.message },
      500
    );
  }
}