import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyAdmin } from "@/lib/notificationHelper";
import { notifyUser } from "@/lib/notificationHelper";
import { getRazorpayInstance, verifyRazorpaySignature } from "@/lib/razorpay";
import { validateCartItems, assertCodAllowedForCart } from "@/lib/orderPricing";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, address, items, paymentMode, razorpay } = body;

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

    const mode = paymentMode === "Razorpay" ? "Razorpay" : "COD";

    if (mode === "COD") {
      const cod = assertCodAllowedForCart(byId, normalized);
      if (!cod.ok) {
        return NextResponse.json({ success: false, message: cod.message }, { status: 400 });
      }
    }

    let paymentStatus = "Pending";
    let razorpayOrderId;
    let razorpayPaymentId;

    if (mode === "Razorpay") {
      const { orderId, paymentId, signature } = razorpay || {};
      if (!orderId || !paymentId || !signature) {
        return NextResponse.json(
          { success: false, message: "Razorpay payment details missing" },
          { status: 400 }
        );
      }

      if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
        return NextResponse.json(
          { success: false, message: "Payment verification failed" },
          { status: 400 }
        );
      }

      const instance = getRazorpayInstance();
      if (!instance) {
        return NextResponse.json(
          { success: false, message: "Payments not configured" },
          { status: 503 }
        );
      }

      const payment = await instance.payments.fetch(paymentId);
      if (payment.order_id !== orderId) {
        return NextResponse.json(
          { success: false, message: "Payment order mismatch" },
          { status: 400 }
        );
      }

      if (payment.status !== "captured" && payment.status !== "authorized") {
        return NextResponse.json(
          { success: false, message: "Payment not completed" },
          { status: 400 }
        );
      }

      const expectedPaise = Math.round(finalTotal * 100);
      if (Number(payment.amount) !== expectedPaise) {
        return NextResponse.json(
          { success: false, message: "Payment amount mismatch" },
          { status: 400 }
        );
      }

      paymentStatus = "Paid";
      razorpayOrderId = orderId;
      razorpayPaymentId = paymentId;
    } else if (paymentMode === "Online") {
      return NextResponse.json(
        { success: false, message: "Please use Razorpay for online payment" },
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
      razorpayOrderId,
      razorpayPaymentId,
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
