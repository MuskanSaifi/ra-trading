import { connectDB } from "@/lib/dbConnect";
import PolicyPage from "@/models/PolicyPage";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";
import { requireAdminAuth } from "@/lib/authHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = requireAdminAuth(async (_req, { params }) => {
  await connectDB();
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) return jsonResponse({ success: false, error: "Missing slug" }, 400);

  const page = await PolicyPage.findOne({ slug }).lean();
  return jsonResponse({ success: true, page: page || null }, 200);
});

export const PUT = requireAdminAuth(async (req, { params }) => {
  await connectDB();
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) return jsonResponse({ success: false, error: "Missing slug" }, 400);

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";

  if (!title) {
    return jsonResponse({ success: false, error: "Title is required" }, 400);
  }

  const page = await PolicyPage.findOneAndUpdate(
    { slug },
    { slug, title, contentHtml, updatedByAdminId: req.adminId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return jsonResponse({ success: true, page }, 200);
});

