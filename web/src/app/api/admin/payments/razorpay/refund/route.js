import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Razorpay refunds are disabled. Use Cashfree refund.",
    },
    { status: 410 }
  );
}
