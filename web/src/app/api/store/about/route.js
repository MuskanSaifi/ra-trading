import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import About from "@/models/About";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    await connectDB();
    const about = await About.findOne().lean();

    return jsonResponse(
      { success: true, about: about || null },
      200,
      {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    );
  } catch (error) {
    console.error("About GET Error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}