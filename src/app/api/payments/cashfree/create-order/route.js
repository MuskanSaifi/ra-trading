import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { validateCartItems } from "@/lib/orderPricing";
import { getIntegrationSettings } from "@/lib/getIntegrationSettings";
import {
  createCashfreeOrder,
  getCashfreeEnv,
  isCashfreeConfigured,
} from "@/lib/cashfree";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await connectDB();

    const settings = await getIntegrationSettings();
    const onlineEnabled =
      settings.cashfreeEnabled !== false && settings.razorpayEnabled !== false;
    if (!onlineEnabled) {
      return NextResponse.json(
        { success: false, message: "Online payments are disabled" },
        { status: 403 }
      );
    }

    if (!isCashfreeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Cashfree is not configured. Add CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET",
        },
        { status: 503 }
      );
    }

    const { userId, items, customer } = await req.json();

    if (!userId || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Missing user or items" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
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

    const { verifiedSubtotal } = validation;
    const shipping = verifiedSubtotal > 0 ? 99 : 0;
    const finalTotal = verifiedSubtotal + shipping;
    const phone = String(customer?.phone || user.phone || "").replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "A valid 10-digit phone is required for Cashfree" },
        { status: 400 }
      );
    }

    const orderId = `cf${String(userId).slice(-6)}${Date.now()}`.slice(0, 40);
    const created = await createCashfreeOrder({
      orderId,
      amount: finalTotal,
      customer: {
        id: String(userId),
        phone,
        name: customer?.name || user.name || "Customer",
        email: user.email || customer?.email || undefined,
      },
    });

    if (!created?.payment_session_id) {
      return NextResponse.json(
        { success: false, message: "Cashfree did not return a payment session" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: created.order_id || orderId,
      paymentSessionId: created.payment_session_id,
      amount: finalTotal,
      currency: "INR",
      mode: getCashfreeEnv(),
    });
  } catch (err) {
    console.error("Cashfree create-order:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Could not start payment" },
      { status: err.status || 500 }
    );
  }
}
