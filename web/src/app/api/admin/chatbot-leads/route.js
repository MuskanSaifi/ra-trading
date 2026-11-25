import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import ChatbotLead from "@/models/ChatbotLead";
import { requireAdminAuth } from "@/lib/authHelpers";

export const GET = requireAdminAuth(async () => {
  await connectDB();
  const leads = await ChatbotLead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: leads });
});

export const DELETE = requireAdminAuth(async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Lead ID is required" },
      { status: 400 }
    );
  }

  const deleted = await ChatbotLead.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
});

