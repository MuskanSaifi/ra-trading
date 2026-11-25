import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyAdmin, notifyUser } from "@/lib/notificationHelper";
import {
  formatPayuAmount,
  getPublicOrigin,
  verifyPayuPayment,
  verifyPayuResponseHash,
} from "@/lib/payu";
import { recordStatus } from "@/lib/orderLifecycle";

export const runtime = "nodejs";

function redirectTo(req, result, orderId) {
  const url = new URL("/payment-status", getPublicOrigin(req));
  url.searchParams.set("result", result);
  if (orderId) url.searchParams.set("order", String(orderId));
  return NextResponse.redirect(url, 303);
}

/** PayU posts the payment result here (surl and furl). */
export async function POST(req) {
  let response = {};
  try {
    const form = await req.formData();
    response = Object.fromEntries(form.entries());
  } catch {
    return redirectTo(req, "failed");
  }

  try {
    await connectDB();

    const order = await Order.findOne({ payuTxnId: String(response.txnid || "") });
    if (!order) return redirectTo(req, "failed");

    if (order.paymentStatus === "Paid") {
      return redirectTo(req, "success", order._id);
    }

    const hashOk = verifyPayuResponseHash(response);
    const amountOk =
      formatPayuAmount(response.amount) === formatPayuAmount(order.totalAmount);
    const userOk = String(response.udf1 || "") === String(order.userId);
    const reportedSuccess = String(response.status).toLowerCase() === "success";

    let confirmed = false;
    if (hashOk && amountOk && userOk && reportedSuccess) {
      try {
        const txn = await verifyPayuPayment(order.payuTxnId);
        confirmed = String(txn?.status).toLowerCase() === "success";
      } catch (err) {
        console.error("PayU verify_payment:", err.message);
      }
    }

    if (!confirmed) {
      order.paymentStatus = "Failed";
      recordStatus(order, "Payment Failed", response.error_Message || "Payment was not completed");
      await order.save();
      return redirectTo(req, "failed", order._id);
    }

    order.paymentStatus = "Paid";
    order.payuPaymentId = response.mihpayid ? String(response.mihpayid) : undefined;
    recordStatus(order, "Pending", "Order placed · paid online via PayU");
    await order.save();

    const user = await User.findById(order.userId).lean();
    await notifyAdmin({
      title: "New Order Received",
      message: `New order #${order._id} placed by ${user?.name || user?.phone || "customer"}. Total: ₹${order.totalAmount} (PayU paid)`,
      type: "order",
      priority: "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/admin-dashboard/orders/${order._id}`,
    });
    await notifyUser({
      userId: order.userId,
      title: "Order Placed Successfully",
      message: `Payment received. Your order #${order._id} has been placed. Total: ₹${order.totalAmount}`,
      type: "order",
      priority: "medium",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: "/user-dashboard/orders",
    });

    return redirectTo(req, "success", order._id);
  } catch (error) {
    console.error("PayU callback:", error);
    return redirectTo(req, "failed");
  }
}

export async function GET(req) {
  return redirectTo(req, "failed");
}
