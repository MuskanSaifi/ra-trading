import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import { NextResponse } from "next/server";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req, context) {
  try {
    await connectDB();

    // ✅ Next.js 15 fix — params is a Promise
    const { category_slug, product_slug } = await context.params;

    if (!category_slug || !product_slug) {
      return NextResponse.json(
        { success: false, message: "Slug missing" },
        { status: 400 }
      );
    }

    // 1️⃣ Find category by slug
    const category = await Category.findOne({ slug: category_slug }).lean();
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Find product by slug + category match
    const product = await Product.findOne({
      slug: product_slug,
      category: category._id,
    })
      .populate("brand")
      .populate("category")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return jsonResponse(
      { success: true, product }, 
      200,
      {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    );
  } catch (error) {
    console.error("Product GET API error:", error);
    return jsonResponse(
      { success: false, message: error.message },
      500
    );
  }
}
