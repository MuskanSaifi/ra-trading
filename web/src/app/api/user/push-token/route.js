import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { jsonResponse, handleOptions, sanitizeInput } from "@/lib/apiHelpers";
import { isExpoPushToken } from "@/lib/expoPush";

export async function OPTIONS() {
  return handleOptions();
}

/** Register (or refresh) an Expo push token for a logged-in customer. */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const userId = sanitizeInput(body?.userId || "", 40);
    const token = sanitizeInput(body?.token || "", 120).trim();

    if (!userId || !token) {
      return jsonResponse({ success: false, message: "userId and token are required" }, 400);
    }
    if (!isExpoPushToken(token)) {
      return jsonResponse({ success: false, message: "Invalid Expo push token" }, 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return jsonResponse({ success: false, message: "User not found" }, 404);
    }

    // Remove this token from any other user (device switched accounts)
    await User.updateMany(
      { _id: { $ne: userId }, expoPushTokens: token },
      { $pull: { expoPushTokens: token } }
    );

    if (!user.expoPushTokens?.includes(token)) {
      user.expoPushTokens = [...(user.expoPushTokens || []), token].slice(-10);
      await user.save();
    }

    return jsonResponse({ success: true, message: "Push token saved" });
  } catch (error) {
    console.error("Push token POST error:", error);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}

/** Remove a push token (logout / permission revoked). */
export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json();
    const userId = sanitizeInput(body?.userId || "", 40);
    const token = sanitizeInput(body?.token || "", 120).trim();

    if (!userId || !token) {
      return jsonResponse({ success: false, message: "userId and token are required" }, 400);
    }

    await User.updateOne({ _id: userId }, { $pull: { expoPushTokens: token } });
    return jsonResponse({ success: true, message: "Push token removed" });
  } catch (error) {
    console.error("Push token DELETE error:", error);
    return jsonResponse({ success: false, message: error.message }, 500);
  }
}
