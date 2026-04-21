import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import HomeGraphicsBlock from "@/models/HomeGraphicsBlock";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    await connectDB();
    const blocks = await HomeGraphicsBlock.find({ enabled: true })
      .sort({ order: -1, updatedAt: -1 })
      .lean();

    return jsonResponse(
      { success: true, blocks },
      200,
      { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    );
  } catch (err) {
    console.error("Graphics GET Error:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

