import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    // 🔹 Extract token from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("authToken="))
      ?.split("=")[1];

    if (token) {
      // ✅ Remove token from DB (logout this session)
      await User.updateOne({ authToken: token }, { $set: { authToken: null } });
    }

    // ✅ Expire cookie
    const expiredCookie = serialize("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });

    const res = NextResponse.json({ success: true, message: "Logged out successfully" });
    res.headers.set("Set-Cookie", expiredCookie);

    return res;
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
