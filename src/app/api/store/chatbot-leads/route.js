import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import ChatbotLead from "@/models/ChatbotLead";
import { handleOptions } from "@/lib/apiHelpers";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const mobileRaw =
      typeof body?.mobile === "string"
        ? body.mobile
        : typeof body?.phone === "string"
        ? body.phone
        : "";
    const mobile = mobileRaw.replace(/\D/g, "");
    const userType = typeof body?.userType === "string" ? body.userType.trim() : "";
    const productInterest =
      typeof body?.productInterest === "string" ? body.productInterest.trim() : "";
    const quantity = typeof body?.quantity === "string" ? body.quantity.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const pagePath = typeof body?.pagePath === "string" ? body.pagePath.trim() : "";

    if (!name || !mobile) {
      return NextResponse.json(
        { success: false, error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    if (name.length > 80 || message.length > 1500) {
      return NextResponse.json(
        { success: false, error: "Input too long" },
        { status: 400 }
      );
    }

    if (mobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Mobile must be 10 digits" },
        { status: 400 }
      );
    }

    const lead = await ChatbotLead.create({
      name,
      mobile,
      userType,
      productInterest,
      quantity,
      message,
      pagePath,
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

