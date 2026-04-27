export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { checkDeliveryCoverage } from "@/lib/deliveryCoverage";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const address = body.address || body;
    const result = await checkDeliveryCoverage(address);
    return NextResponse.json(
      { success: result.ok, ...result },
      { status: result.ok ? 200 : result.status || 400 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

