import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// GET user notifications
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    if (!userId) {
      return jsonResponse(
        { success: false, message: "UserId is required" },
        400
      );
    }
    
    const query = { userId };
    if (unreadOnly) query.isRead = false;
    
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    
    return jsonResponse({
      success: true,
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get User Notifications Error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
