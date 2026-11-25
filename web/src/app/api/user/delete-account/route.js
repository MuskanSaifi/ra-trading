import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/dbConnect"; // ✅ FIX
import User from "@/models/User";
import DeleteAccountRequest from "@/models/DeleteAccountRequest";

export async function POST(request) {
  try {
    await connectDB();

    const { reason } = await request.json();

    if (!reason) {
      return Response.json(
        { success: false, message: "Reason is required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id authToken");
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const existing = await DeleteAccountRequest.findOne({
      user: user._id,
      status: "pending",
    });

    if (existing) {
      return Response.json({
        success: true,
        message: "Deletion request already submitted",
      });
    }

    await DeleteAccountRequest.create({
      user: user._id,
      reason, // ✅ IMPORTANT
    });

    // logout
    user.authToken = null;
    await user.save({ validateBeforeSave: false });

    cookieStore.set("authToken", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return Response.json({
      success: true,
      message:
        "Account deletion request submitted. Your account will be deleted within 7 days.",
    });
  } catch (err) {
    console.error("Delete account request error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
