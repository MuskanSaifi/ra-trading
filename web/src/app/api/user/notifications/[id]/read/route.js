import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// PUT /api/user/notifications/[id]/read
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // ✅ Await params
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
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

// PATCH /api/user/notifications/[id]/read
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // ✅ Await params
    const body = await req.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? body.isRead : true;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
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
