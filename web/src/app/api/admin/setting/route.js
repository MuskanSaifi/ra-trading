import { NextResponse } from "next/server";
import AdminSetting from "@/models/AdminSetting";
import { connectDB } from "@/lib/dbConnect";

export async function GET() {
  try {
    await connectDB();
    const settings = await AdminSetting.findOne();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
