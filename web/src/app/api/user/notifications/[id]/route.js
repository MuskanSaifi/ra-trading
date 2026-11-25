import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // ✅ Await params
    const { isRead } = await req.json();
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: isRead !== undefined ? isRead : true },
      { new: true }
    );
    
    if (!notification) {
      return jsonResponse(
        { success: false, message: "Notification not found" },
        404
      );
    }
    
    return jsonResponse({ success: true, notification });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
