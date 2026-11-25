import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { product_id } = await params;

    if (!product_id) {
      return NextResponse.json(
        { success: false, message: "Product ID missing" },
        { status: 400 }
      );
    }

    const product = await Product.findById(product_id)
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product Not Found" },
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
      { success: false, message: "Internal Server Error" },
      500
    );
  }
}
