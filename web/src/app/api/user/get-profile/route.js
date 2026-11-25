import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();  // FIXED

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
 
    // Clean profilePic
    const pp = user.profilePic?.url ? user.profilePic.url.trim() : "";

    return NextResponse.json(
      {
        success: true,
        user: {
          ...user._doc,
          profilePic: pp,  // ALWAYS return a string URL
        },
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
