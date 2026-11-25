import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/authHelpers";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { isShiprocketConfigured } from "@/lib/shiprocket";
import { schedulePickup } from "@/lib/orderLifecycle";

export const runtime = "nodejs";

/** Requests (or re-requests) a courier pickup for a shipped order. */
async function handlePOST(req) {
  try {
    if (!isShiprocketConfigured()) {
      return NextResponse.json({ success: false, message: "Shiprocket not configured" }, { status: 503 });
    }
    await connectDB();
    const { orderId } = await req.json();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const pickup = await schedulePickup(order);
    await order.save();

    return NextResponse.json(
      {
        success: pickup.ok,
        message: pickup.ok
          ? `Pickup requested${pickup.scheduledDate ? ` for ${pickup.scheduledDate}` : ""}`
          : pickup.message,
        order,
      },
      { status: pickup.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const POST = requireAdminAuth(handlePOST);
