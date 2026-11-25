export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminSetting from "@/models/AdminSetting";
import { connectDB } from "@/lib/dbConnect";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!emailRaw || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    const email = emailRaw.toLowerCase();

    const admin = await AdminSetting.findOne({
      siteAdminEmail: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "Server misconfiguration: JWT_SECRET is not set" },
        { status: 500 }
      );
    }

    // Keep admin session for ~30 days
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    const res = NextResponse.json({
      success: true,
      message: "Login success",
      token,
    });

    res.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "strict", // Stricter same-site policy
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return res;

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
