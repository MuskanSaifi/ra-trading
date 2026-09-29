import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyAdmin } from "@/lib/notificationHelper";
import { notifyUser } from "@/lib/notificationHelper";
import { getCashfreeOrder, getCashfreePayments } from "@/lib/cashfree";
import { validateCartItems, assertCodAllowedForCart } from "@/lib/orderPricing";
import { checkDeliveryCoverage } from "@/lib/deliveryCoverage";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, address, items, paymentMode, cashfree } = body;

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

    const mode = paymentMode === "Cashfree" ? "Cashfree" : "COD";

    if (mode === "COD") {
      const cod = assertCodAllowedForCart(byId, normalized);
      if (!cod.ok) {
        return NextResponse.json({ success: false, message: cod.message }, { status: 400 });
      }
    }

    let paymentStatus = "Pending";
    let cashfreeOrderId;
    let cashfreePaymentId;

    if (mode === "Cashfree") {
      const orderId = cashfree?.orderId;
      if (!orderId) {
        return NextResponse.json(
          { success: false, message: "Cashfree payment details missing" },
          { status: 400 }
        );
      }

      const cfOrder = await getCashfreeOrder(orderId);
      if (String(cfOrder?.order_status || "").toUpperCase() !== "PAID") {
        return NextResponse.json(
          { success: false, message: "Payment not completed" },
          { status: 400 }
        );
      }

      const paidAmount = Number(cfOrder.order_amount);
      if (Math.abs(paidAmount - finalTotal) > 0.5) {
        return NextResponse.json(
          { success: false, message: "Payment amount mismatch" },
          { status: 400 }
        );
      }

      let paymentId = cashfree?.paymentId || "";
      try {
        const payments = await getCashfreePayments(orderId);
        const list = Array.isArray(payments) ? payments : payments?.payments || [];
        const successPay = list.find(
          (p) => String(p.payment_status || "").toUpperCase() === "SUCCESS"
        );
        paymentId = successPay?.cf_payment_id || paymentId;
      } catch {
        // Order is already PAID; payment id is optional
      }

      paymentStatus = "Paid";
      cashfreeOrderId = orderId;
      cashfreePaymentId = paymentId ? String(paymentId) : undefined;
    } else if (paymentMode === "Online" || paymentMode === "Razorpay") {
      return NextResponse.json(
        { success: false, message: "Please use Cashfree for online payment" },
        { status: 400 }
      );
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
      paymentStatus,
      cashfreeOrderId,
      cashfreePaymentId,
      status: "Pending",
      expectedDelivery,
    });

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
