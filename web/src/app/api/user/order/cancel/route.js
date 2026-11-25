import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { notifyAdmin, notifyUser } from "@/lib/notificationHelper";
import { cancelOrder } from "@/lib/orderLifecycle";
import { canCustomerCancel } from "@/lib/orderStatus";

export async function POST(req) {
  try {
    await connectDB();
    const { orderId, userId, reason } = await req.json();

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (!canCustomerCancel(order)) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been shipped and can no longer be cancelled.",
        },
        { status: 400 }
      );
    }

    if (!String(reason || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Please choose a cancellation reason" },
        { status: 400 }
      );
    }

    const { refund } = await cancelOrder(order, { by: "user", reason: String(reason).trim() });

    let message = "Your order has been cancelled.";
    if (refund.ok) {
      message += " A refund to your original payment method has been initiated and usually reaches you in 5–7 business days.";
    } else if (!refund.skipped) {
      message += " Your refund will be processed by our team shortly.";
    }

    await notifyUser({
      userId: order.userId,
      title: "Order Cancelled",
      message: `Order #${order._id}: ${message}`,
      type: "order",
      priority: "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/user-dashboard/orders/${order._id}`,
    });
    await notifyAdmin({
      title: "Order cancelled by customer",
      message: `Order #${order._id} was cancelled. Reason: ${order.cancelReason}${
        refund.ok ? " · PayU refund initiated" : !refund.skipped ? " · Refund needs attention" : ""
      }`,
      type: "order",
      priority: refund.ok || refund.skipped ? "medium" : "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/admin-dashboard/orders/${order._id}`,
    });

    return NextResponse.json({ success: true, message, order });
  } catch (err) {
    console.error("Cancel Error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
