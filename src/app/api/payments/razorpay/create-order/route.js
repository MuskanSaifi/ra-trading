import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { getRazorpayInstance, getRazorpayKeyIdForClient } from "@/lib/razorpay";
import { validateCartItems } from "@/lib/orderPricing";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await connectDB();

    const { userId, items } = await req.json();

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

    const instance = getRazorpayInstance();
    const keyId = getRazorpayKeyIdForClient();
    if (!instance || !keyId) {
      return NextResponse.json(
        { success: false, message: "Online payments are not configured" },
        { status: 503 }
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

    const { verifiedSubtotal } = validation;
    const shipping = verifiedSubtotal > 0 ? 99 : 0;
    const finalTotal = verifiedSubtotal + shipping;
    const amountPaise = Math.round(finalTotal * 100);

    const order = await instance.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${String(userId).slice(-8)}_${Date.now()}`,
      notes: {
        userId: String(userId),
        totalRupee: String(finalTotal),
      },
    });

    return NextResponse.json({
      success: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Razorpay create-order:", err);
    return NextResponse.json(
      { success: false, message: "Could not start payment" },
      { status: 500 }
    );
  }
}
