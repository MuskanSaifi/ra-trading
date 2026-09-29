import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    await connectDB();

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(id)
      .populate("items.productId", "name images price slug")
      .populate("userId", "name email phone");

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Single Order Error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
