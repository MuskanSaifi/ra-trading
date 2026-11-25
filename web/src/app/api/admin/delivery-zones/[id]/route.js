export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import DeliveryZone from "@/models/DeliveryZone";
import { requireAdminAuth } from "@/lib/authHelpers";

export const DELETE = requireAdminAuth(async (_req, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    await DeliveryZone.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
});

