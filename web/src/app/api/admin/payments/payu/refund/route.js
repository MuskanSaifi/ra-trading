import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { notifyUser } from "@/lib/notificationHelper";
import { refundOrderPayment } from "@/lib/orderLifecycle";

export const runtime = "nodejs";

async function handlePOST(req) {
  try {
    await connectDB();
    const { orderId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const refund = await refundOrderPayment(order, reason);
    if (refund.skipped) {
      return NextResponse.json(
        { success: false, message: "Refund only available for paid PayU orders" },
        { status: 400 }
      );
    }

    if (refund.ok && !order.cancelReason) order.cancelReason = reason || "Refund processed";
    await order.save();

    if (!refund.ok) {
      return NextResponse.json(
        { success: false, message: refund.message || "Refund failed", order },
        { status: 502 }
      );
    }

    await notifyUser({
      userId: order.userId,
      title: "Refund Initiated",
      message: `Refund of ₹${Number(order.totalAmount).toFixed(2)} initiated for order #${order._id}. It usually reaches you in 5–7 business days.`,
      type: "order",
      priority: "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/user-dashboard/orders/${order._id}`,
    });

    return NextResponse.json({ success: true, message: "Refund request sent to PayU", order });
  } catch (error) {
    console.error("PayU refund:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Refund failed" },
      { status: error.status || 500 }
    );
  }
}

export const POST = requireAdminAuth(handlePOST);
