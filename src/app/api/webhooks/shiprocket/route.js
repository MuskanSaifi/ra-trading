import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { mapShiprocketStatus } from "@/lib/shiprocket";
import { notifyUser } from "@/lib/notificationHelper";
import mongoose from "mongoose";

export const runtime = "nodejs";

/**
 * Shiprocket webhook: set URL to /api/webhooks/shiprocket
 * Optional auth: SHIPROCKET_WEBHOOK_TOKEN as x-api-key or ?token=
 */
export async function POST(req) {
  try {
    const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expected) {
      const headerToken = req.headers.get("x-api-key") || "";
      const { searchParams } = new URL(req.url);
      const queryToken = searchParams.get("token") || "";
      if (headerToken !== expected && queryToken !== expected) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();
    const payload = await req.json();

    const awb =
      payload?.awb ||
      payload?.awb_code ||
      payload?.data?.awb ||
      null;

    const srOrderId =
      payload?.order_id ||
      payload?.sr_order_id ||
      payload?.data?.order_id ||
      null;

    const currentStatus =
      payload?.current_status ||
      payload?.shipment_status ||
      payload?.status ||
      payload?.data?.current_status ||
      "";

    let order = null;
    if (awb) {
      order = await Order.findOne({ awb: String(awb) });
    }
    if (!order && srOrderId) {
      order = await Order.findOne({ shiprocketOrderId: String(srOrderId) });
    }
    if (
      !order &&
      srOrderId &&
      mongoose.Types.ObjectId.isValid(String(srOrderId))
    ) {
      order = await Order.findById(srOrderId);
    }

    if (!order) {
      return NextResponse.json({
        success: true,
        message: "No matching order (ignored)",
      });
    }

    const mapped = mapShiprocketStatus(currentStatus);
    if (mapped && order.status !== mapped) {
      order.status = mapped;
      if (mapped === "Shipped" || mapped === "Out for Delivery") {
        const d = new Date();
        d.setDate(d.getDate() + (mapped === "Out for Delivery" ? 1 : 4));
        order.expectedDelivery = d;
      }
      if (mapped === "Delivered" && order.paymentMode === "COD") {
        order.paymentStatus = "Paid";
      }
      await order.save();

      await notifyUser({
        userId: order.userId,
        title: "Shipment Update",
        message: `Order #${order._id}: ${mapped}${awb ? ` (AWB ${awb})` : ""}`,
        type: "order",
        priority: "medium",
        relatedId: order._id,
        relatedType: "order",
        actionUrl: "/user-dashboard/orders",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shiprocket webhook:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook error" },
      { status: 500 }
    );
  }
}
