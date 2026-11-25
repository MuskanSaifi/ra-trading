import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendExpoPush } from "@/lib/expoPush";

/**
 * Create notification for admin
 */
export async function notifyAdmin({ title, message, type = "info", priority = "medium", relatedId = null, relatedType = null, actionUrl = null }) {
  try {
    await Notification.create({
      forAdmin: true,
      title,
      message,
      type,
      priority,
      relatedId,
      relatedType,
      actionUrl,
    });
  } catch (error) {
    console.error("Error creating admin notification:", error);
  }
}

/**
 * Create notification for user (+ Expo push to their app devices when available)
 */
export async function notifyUser({ userId, title, message, type = "info", priority = "medium", relatedId = null, relatedType = null, actionUrl = null }) {
  try {
    if (!userId) return;

    await Notification.create({
      userId,
      title,
      message,
      type,
      priority,
      relatedId,
      relatedType,
      actionUrl,
    });

    try {
      const user = await User.findById(userId).select("expoPushTokens").lean();
      const tokens = user?.expoPushTokens || [];
      if (tokens.length) {
        await sendExpoPush(tokens, {
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
      }
    } catch (pushErr) {
      console.error("notifyUser push error:", pushErr);
    }
  } catch (error) {
    console.error("Error creating user notification:", error);
  }
}
