import Brand from "@/models/Brand";
import { connectDB } from "@/lib/dbConnect";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find({ status: "active" })
      .select("name slug image")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse(
      { success: true, brands },
      200,
      { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    );
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

