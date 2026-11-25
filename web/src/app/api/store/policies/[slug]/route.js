import { connectDB } from "@/lib/dbConnect";
import PolicyPage from "@/models/PolicyPage";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;
    if (!slug) {
      return jsonResponse({ success: false, error: "Missing slug" }, 400);
    }

    const page = await PolicyPage.findOne({ slug }).lean();
    return jsonResponse(
      { success: true, page: page || null },
      200,
      { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    );
  } catch (error) {
    console.error("PolicyPage GET Error:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

