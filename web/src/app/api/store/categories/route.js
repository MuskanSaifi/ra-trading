import { NextResponse } from "next/server";
import Category from "@/models/Category";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

// 🟢 GET -> All categories
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find()
      .select("name slug image description pageTitle metaTitle metaKeywords metaDescription contentHtml")
      .sort({ createdAt: -1 })
      .lean();
    
    return jsonResponse(
      { success: true, categories },
      200,
      {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    );
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
