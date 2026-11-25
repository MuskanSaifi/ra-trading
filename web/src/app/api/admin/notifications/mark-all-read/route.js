import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH() {
  try {
    await connectDB();
    
    await Notification.updateMany(
      { forAdmin: true, isRead: false },
      { isRead: true }
    );
    
    return jsonResponse({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
