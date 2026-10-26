import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { notifyUser } from "@/lib/notificationHelper";
import { isCashfreeConfigured, refundCashfreePayment } from "@/lib/cashfree";

export const runtime = "nodejs";

async function handlePOST(req) {
  try {
    await connectDB();
    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentMode !== "Cashfree" || !order.cashfreeOrderId) {
      return NextResponse.json(
        { success: false, message: "Refund only available for paid Cashfree orders" },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "Refund Completed") {
      return NextResponse.json(
        { success: false, message: "Already refunded" },
        { status: 400 }
      );
    }

    if (!isCashfreeConfigured()) {
      return NextResponse.json(
        { success: false, message: "Cashfree not configured" },
        { status: 503 }
      );
    }

    const refundAmount = Number(amount || order.totalAmount);
    const refundId = `rf${String(order._id).slice(-8)}${Date.now()}`.slice(0, 40);

    order.paymentStatus = "Refund Initiated";
    await order.save();

    const refund = await refundCashfreePayment({
      orderId: order.cashfreeOrderId,
      amount: refundAmount,
      refundId,
      note: reason || "Admin refund",
    });

    order.paymentStatus = "Refund Completed";
    order.cancelReason = order.cancelReason || reason || "Refund processed";
    await order.save();

    await notifyUser({
      userId: order.userId,
      title: "Refund Processed",
      message: `Refund of ₹${refundAmount.toFixed(2)} initiated for order #${order._id}`,
      type: "order",
      priority: "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: "/user-dashboard/orders",
    });

    return NextResponse.json({
      success: true,
      message: "Refund successful",
      refund,
      order,
    });
  } catch (error) {
    console.error("Cashfree refund:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Refund failed" },
      { status: error.status || 500 }
    );
  }
}

export const POST = requireAdminAuth(handlePOST);
