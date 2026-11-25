import { connectDB } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { requireAdminAuth } from "@/lib/authHelpers";
import { jsonResponse, handleOptions, sanitizeInput } from "@/lib/apiHelpers";
import { sendExpoPush } from "@/lib/expoPush";

export async function OPTIONS() {
  return handleOptions();
}

// POST - Admin sends a notification to one or many customers (+ Expo push to app)
export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const title = sanitizeInput(body?.title || "", 120);
    const message = sanitizeInput(body?.message || "", 1000);
    const type = sanitizeInput(body?.type || "info", 20);
    const priority = sanitizeInput(body?.priority || "medium", 20);
    const actionUrl = sanitizeInput(body?.actionUrl || "", 200) || null;
    const relatedId = body?.relatedId || null;
    const relatedType = sanitizeInput(body?.relatedType || "", 40) || null;

    if (!title || !message) {
      return jsonResponse(
        { success: false, message: "Title and message are required" },
        400
      );
    }

    const targetUserIds =
      Array.isArray(body?.userIds) && body.userIds.length > 0
        ? body.userIds
        : body?.userId
          ? [body.userId]
          : [];

    if (targetUserIds.length === 0) {
      return jsonResponse(
        { success: false, message: "At least one user is required" },
        400
      );
    }

    const users = await User.find({ _id: { $in: targetUserIds } })
      .select("_id expoPushTokens name phone")
      .lean();

    if (users.length === 0) {
      return jsonResponse({ success: false, message: "No matching users found" }, 400);
    }

    const foundIds = users.map((u) => u._id);

    const notifications = await Notification.insertMany(
      foundIds.map((uid) => ({
        userId: uid,
        title,
        message,
        type: ["order", "product", "user", "system", "alert", "info"].includes(type)
          ? type
          : "info",
        priority: ["low", "medium", "high", "urgent"].includes(priority)
          ? priority
          : "medium",
        relatedId,
        relatedType,
        actionUrl,
        isRead: false,
      }))
    );

    const pushTokens = users.flatMap((u) => u.expoPushTokens || []);
    const pushResult = await sendExpoPush(pushTokens, {
      title,
      body: message,
      priority,
      data: {
        type,
        actionUrl: actionUrl || "",
        relatedType: relatedType || "",
        relatedId: relatedId ? String(relatedId) : "",
        screen: "notifications",
      },
    });

    return jsonResponse(
      {
        success: true,
        message: `Notification sent to ${notifications.length} user(s)`,
        notifications,
        push: {
          devices: pushResult.sent,
          note:
            pushResult.sent > 0
              ? "Push delivered to app devices that are logged in"
              : "Saved in-app. Users will see it when they open Notifications (push when they install & allow notifications).",
        },
      },
      201
    );
  } catch (error) {
    console.error("Send User Notification Error:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});
