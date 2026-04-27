import { connectDB } from "@/lib/dbConnect";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Brand from "@/models/Brand"; // ✅ REQUIRED FOR populate
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { category_slug } = await params;

    if (!category_slug) {
      return NextResponse.json(
        { success: false, message: "Category identifier missing" },
        { status: 400 }
      );
    }

    let category = null;

    if (mongoose.Types.ObjectId.isValid(category_slug)) {
      category = await Category.findById(category_slug).lean();
    }

    if (!category) {
      category = await Category.findOne({ slug: category_slug }).lean();
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Product.countDocuments({ category: category._id, status: "active" });

    // Fetch products with pagination, lean, and field selection
    const products = await Product.find({ category: category._id, status: "active" })
      .select("name slug price salePrice discount images stock isTrending isFeatured isNewArrival category brand createdAt imageBgColor minOrder codAvailable")
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return jsonResponse({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      products,
    }, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    });
  } catch (error) {
    console.error("❌ Category Products API Error:", error);

    return jsonResponse(
      { success: false, message: "Internal Server Error" },
      500
    );
  }
}
