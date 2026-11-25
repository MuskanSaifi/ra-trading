import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// PATCH - Edit sent notification
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // ✅ Await params
    const { title, message } = await req.json();
    
    if (!title || !message) {
      return jsonResponse(
        { success: false, message: "Title and message are required" },
        400
      );
    }
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { title, message },
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

// DELETE - Delete sent notification
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // ✅ Await params
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return jsonResponse(
        { success: false, message: "Notification not found" },
        404
      );
    }
    
    return jsonResponse({ 
      success: true, 
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
