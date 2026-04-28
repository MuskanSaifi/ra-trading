import { connectDB } from "@/lib/dbConnect";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";
import Reel from "@/models/Reel";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    await connectDB();
    const reels = await Reel.find({ enabled: true })
      .sort({ order: -1, updatedAt: -1 })
      .select("title video.url poster.url order")
      .lean();

    return jsonResponse(
      { success: true, reels },
      200,
      {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      }
    );
  } catch (error) {
    console.error("Reels GET Error:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

