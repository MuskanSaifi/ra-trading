import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// PUT /api/user/notifications/mark-all-read
export async function PUT(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return jsonResponse(
        { success: false, message: "UserId is required" },
        400
      );
    }
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    return jsonResponse({ 
      success: true, 
      message: "All notifications marked as read" 
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}

// PATCH /api/user/notifications/mark-all-read (alternative)
export async function PATCH(req) {
  try {
    await connectDB();
    
    const { userId } = await req.json();
    
    if (!userId) {
      return jsonResponse(
        { success: false, message: "UserId is required" },
        400
      );
    }
    
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    return jsonResponse({ 
      success: true, 
      message: "All notifications marked as read" 
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
