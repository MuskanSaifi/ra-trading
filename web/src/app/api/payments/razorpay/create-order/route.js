import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Razorpay is disabled. Checkout now uses Cashfree.",
    },
    { status: 410 }
  );
}
