import { NextResponse } from "next/server";
import Order from "@/models/Order";
import User from "@/models/User";
import { connectDB } from "@/lib/dbConnect";
import { getIntegrationSettings } from "@/lib/getIntegrationSettings";
import { recordStatus } from "@/lib/orderLifecycle";
import { isPaymentIncomplete } from "@/lib/orderStatus";
import {
  buildPayuPaymentForm,
  getPublicOrigin,
  isPayuConfigured,
  newPayuTxnId,
} from "@/lib/payu";

export const runtime = "nodejs";

/** Starts a new PayU attempt for an order whose online payment did not complete. */
export async function POST(req) {
  try {
    await connectDB();
    const { orderId, userId } = await req.json();

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (order.paymentMode !== "PayU" || !isPaymentIncomplete(order)) {
      return NextResponse.json(
        { success: false, message: "This order does not need payment" },
        { status: 400 }
      );
    }

    const settings = await getIntegrationSettings();
    if (settings.payuEnabled === false || !isPayuConfigured()) {
      return NextResponse.json(
        { success: false, message: "Online payment is not available right now" },
        { status: 503 }
      );
    }

    const user = await User.findById(userId).lean();
    const phone = String(order.address?.phone || user?.phone || "").replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "A valid 10-digit phone is required for online payment" },
        { status: 400 }
      );
    }

    order.payuTxnId = newPayuTxnId();
    order.paymentStatus = "Pending";
    recordStatus(order, "Payment Pending", "Payment retried");
    await order.save();

    const callback = `${getPublicOrigin(req)}/api/payments/payu/callback`;
    const firstname =
      String(order.address?.name || user?.name || "Customer")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .slice(0, 60) || "Customer";

    const payu = buildPayuPaymentForm({
      txnid: order.payuTxnId,
      amount: order.totalAmount,
      productinfo: "RA Trading order",
      firstname,
      email: user?.email || process.env.PAYU_FALLBACK_EMAIL || "orders@ratradingco.com",
      phone,
      surl: callback,
      furl: callback,
      udf: { udf1: String(userId), udf2: String(order._id) },
    });

    return NextResponse.json({ success: true, payu });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
