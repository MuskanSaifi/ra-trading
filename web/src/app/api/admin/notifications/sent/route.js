import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

// GET - Admin ke dwara bheje gaye notifications
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    
    // ✅ Actual user notifications (jo admin ne bheje hain)
    // Optional: Last 30 days ke notifications
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const notifications = await Notification.find({
      userId: { $exists: true, $ne: null },
      forAdmin: false,
      createdAt: { $gte: thirtyDaysAgo }, // Optional: remove this line for all notifications
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name phone email")
      .lean();
    
    const total = await Notification.countDocuments({
      userId: { $exists: true, $ne: null },
      forAdmin: false,
      createdAt: { $gte: thirtyDaysAgo }, // Optional: remove this line for all notifications
    });
    
    return jsonResponse({
      success: true,
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get Sent Notifications Error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500
    );
  }
}
