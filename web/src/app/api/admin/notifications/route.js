import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// GET all admin notifications
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");
    
    const query = { forAdmin: true };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ forAdmin: true, isRead: false });
    
    return jsonResponse({
      success: true,
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get Admin Notifications Error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}

// POST - Create admin notification
export async function POST(req) {
  try {
    await connectDB();
    
    const { title, message, type, priority, relatedId, relatedType, actionUrl } = await req.json();
    
    if (!title || !message) {
      return jsonResponse(
        { success: false, message: "Title and message are required" },
        400
      );
    }
    
    const notification = await Notification.create({
      forAdmin: true,
      title,
      message,
      type: type || "info",
      priority: priority || "medium",
      relatedId,
      relatedType,
      actionUrl,
    });
    
    return jsonResponse({ success: true, notification }, 201);
  } catch (error) {
    console.error("Create Admin Notification Error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
