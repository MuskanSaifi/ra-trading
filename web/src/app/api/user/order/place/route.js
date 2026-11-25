import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyAdmin } from "@/lib/notificationHelper";
import { notifyUser } from "@/lib/notificationHelper";
import { getIntegrationSettings } from "@/lib/getIntegrationSettings";
import {
  buildPayuPaymentForm,
  getPublicOrigin,
  isPayuConfigured,
  newPayuTxnId,
} from "@/lib/payu";
import { validateCartItems, assertCodAllowedForCart } from "@/lib/orderPricing";
import { checkDeliveryCoverage } from "@/lib/deliveryCoverage";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, address, items, paymentMode } = body;

    if (!userId || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Required fields missing" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const normalized = items.map((i) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      price: Number(i.price),
    }));

    const validation = await validateCartItems(normalized);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: validation.status }
      );
    }

    const { byId, verifiedSubtotal } = validation;
    const shipping = verifiedSubtotal > 0 ? 99 : 0;
    const finalTotal = verifiedSubtotal + shipping;

    const mode = paymentMode === "PayU" ? "PayU" : "COD";

    if (["Online", "Razorpay", "Cashfree", "Easebuzz"].includes(paymentMode)) {
      return NextResponse.json(
        { success: false, message: "Please use PayU for online payment" },
        { status: 400 }
      );
    }

    if (mode === "COD") {
      const cod = assertCodAllowedForCart(byId, normalized);
      if (!cod.ok) {
        return NextResponse.json({ success: false, message: cod.message }, { status: 400 });
      }
    }

    let payuTxnId;
    let payuPhone;
    if (mode === "PayU") {
      const settings = await getIntegrationSettings();
      if (settings.payuEnabled === false || !isPayuConfigured()) {
        return NextResponse.json(
          { success: false, message: "Online payment is not available right now" },
          { status: 503 }
        );
      }

      payuPhone = String(address?.phone || user.phone || "").replace(/\D/g, "").slice(-10);
      if (!/^\d{10}$/.test(payuPhone)) {
        return NextResponse.json(
          { success: false, message: "A valid 10-digit phone is required for online payment" },
          { status: 400 }
        );
      }
      payuTxnId = newPayuTxnId();
    }

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 5);

    const shippingAddress = {
      name: address.name,
      phone: address.phone,
      alternatePhone: address.alternatePhone || "",
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    // ✅ Delivery coverage validation
    const coverage = await checkDeliveryCoverage({
      country: address.country || "India",
      state: address.state,
      city: address.city,
      pincode: address.pincode,
    });
    if (!coverage.ok) {
      return NextResponse.json(
        {
          success: false,
          message: coverage.message,
          suggestions: coverage.suggestions || [],
          code: "NOT_SERVICEABLE",
        },
        { status: 400 }
      );
    }

    const orderItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const order = await Order.create({
      userId,
      address: shippingAddress,
      items: orderItems,
      totalAmount: finalTotal,
      paymentMode: mode,
      paymentStatus: "Pending",
      payuTxnId,
      status: mode === "PayU" ? "Payment Pending" : "Pending",
      statusHistory: [
        mode === "PayU"
          ? { status: "Payment Pending", note: "Waiting for online payment" }
          : { status: "Pending", note: "Order placed (Cash on delivery)" },
      ],
      expectedDelivery,
    });

    // Online orders are confirmed (and notified) by the PayU callback
    if (mode === "PayU") {
      const callback = `${getPublicOrigin(req)}/api/payments/payu/callback`;
      const firstname =
        String(address?.name || user.name || "Customer")
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .trim()
          .slice(0, 60) || "Customer";
      const payu = buildPayuPaymentForm({
        txnid: payuTxnId,
        amount: finalTotal,
        productinfo: "RA Trading order",
        firstname,
        email: user.email || process.env.PAYU_FALLBACK_EMAIL || "orders@ratradingco.com",
        phone: payuPhone,
        surl: callback,
        furl: callback,
        udf: { udf1: String(userId), udf2: String(order._id) },
      });
      return NextResponse.json({ success: true, order, payu });
    }

    await notifyAdmin({
      title: "New Order Received",
      message: `New order #${order._id} placed by ${user.name || user.phone}. Total: ₹${finalTotal}`,
      type: "order",
      priority: "high",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/admin-dashboard/orders/${order._id}`,
    });

    await notifyUser({
      userId: user._id,
      title: "Order Placed Successfully",
      message: `Your order #${order._id} has been placed successfully. Total: ₹${finalTotal}`,
      type: "order",
      priority: "medium",
      relatedId: order._id,
      relatedType: "order",
      actionUrl: `/user-dashboard/orders`,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.log("Order Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
