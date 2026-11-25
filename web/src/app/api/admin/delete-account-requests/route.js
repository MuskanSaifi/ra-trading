import { connectDB } from "@/lib/dbConnect";
import DeleteAccountRequest from "@/models/DeleteAccountRequest";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectDB();

    // ✅ FIX: cookies() is async in Next.js 15
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔐 Verify admin token
    jwt.verify(token, process.env.JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const requests = await DeleteAccountRequest.find({ status })
      .populate("user", "name phone email")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("Fetch delete requests error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}