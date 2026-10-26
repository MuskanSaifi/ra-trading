import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import { notifyUser } from "@/lib/notificationHelper";
import { cancelOrder, recordStatus } from "@/lib/orderLifecycle";
import { isCancelled } from "@/lib/orderStatus";

const CUSTOMER_MESSAGES = {
  Confirmed: "has been confirmed and is being prepared.",
  Processing: "is being prepared.",
  Packed: "has been packed and will ship soon.",
  "Out for Delivery": "is out for delivery today.",
  Delivered: "has been delivered. Thank you for shopping with us!",
  Completed: "has been delivered. Thank you for shopping with us!",
  "Return Approved": "return request has been approved.",
  "Return Rejected": "return request was not approved.",
  "Refund Completed": "refund has been completed.",
};

export async function PUT(req) {
  try {
    await connectDB();
    const { orderId, status, cancelReason } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.status === status) {
      return NextResponse.json({ success: true, message: "Status unchanged" });
    }

    let message;
    let notes = [];

    if (status === "Cancelled by Admin") {
      if (isCancelled(order.status)) {
        return NextResponse.json(
          { success: false, message: "Order is already cancelled" },
          { status: 400 }
        );
      }
      const result = await cancelOrder(order, { by: "admin", reason: cancelReason });
      notes = result.notes;
      message = `Your order #${order._id} has been cancelled. Reason: ${order.cancelReason}.${
        result.refund.ok ? " A refund has been initiated to your original payment method." : ""
      }`;
    } else {
      if (!isCancelled(status)) order.cancelReason = "";
      if (status === "Refund Completed") order.paymentStatus = "Refund Completed";
      recordStatus(order, status, "Updated by admin");
      await order.save();

      if (status === "Shipped") {
        message = `Your order #${order._id} has been shipped. Expected delivery: ${order.expectedDelivery?.toLocaleDateString("en-IN")}`;
      } else {
        message = `Your order #${order._id} ${CUSTOMER_MESSAGES[status] || `status is now: ${status}`}`;
      }
    }

    await notifyUser({
      userId: order.userId,
      title: "Order Update",
      message,
      type: "order",
      priority: isCancelled(status) ? "high" : "medium",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/user-dashboard/orders/${order._id}`,
    });

    return NextResponse.json({
      success: true,
      message: notes.length ? `Order updated. ${notes.join(". ")}` : "Order updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
