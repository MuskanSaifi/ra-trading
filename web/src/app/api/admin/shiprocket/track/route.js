import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { trackShiprocketByAwb, isShiprocketConfigured } from "@/lib/shiprocket";

export const runtime = "nodejs";

async function handleGET(req) {
  try {
    if (!isShiprocketConfigured()) {
      return NextResponse.json(
        { success: false, message: "Shiprocket not configured" },
        { status: 503 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const awbParam = searchParams.get("awb");

    let awb = awbParam;
    if (!awb && orderId) {
      const order = await Order.findById(orderId).select("awb trackingUrl courierName status");
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }
      awb = order.awb;
      if (!awb) {
        return NextResponse.json(
          { success: false, message: "No AWB on this order yet" },
          { status: 400 }
        );
      }
    }

    if (!awb) {
      return NextResponse.json(
        { success: false, message: "orderId or awb is required" },
        { status: 400 }
      );
    }

    const tracking = await trackShiprocketByAwb(awb);
    return NextResponse.json({ success: true, awb, tracking });
  } catch (error) {
    console.error("Shiprocket track:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Tracking failed" },
      { status: error.status || 500 }
    );
  }
}

export const GET = requireAdminAuth(handleGET);
