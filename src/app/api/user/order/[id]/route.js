import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Order from "@/models/Order";
import { connectDB } from "@/lib/dbConnect";
import { ORDER_FIELDS_FOR_CUSTOMER } from "@/lib/orderStatus";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userId = new URL(req.url).searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(String(id))) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = await Order.findOne({ _id: id, userId })
      .select(ORDER_FIELDS_FOR_CUSTOMER)
      .populate("items.productId", "name images price slug category")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
