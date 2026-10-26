import { NextResponse } from "next/server";
import Order from "@/models/Order";
import { connectDB } from "@/lib/dbConnect";
import { ORDER_FIELDS_FOR_CUSTOMER } from "@/lib/orderStatus";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const skip = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ success: false, message: "UserId missing" });
  }

  try {
    const total = await Order.countDocuments({ userId });
    const orders = await Order.find({ userId })
      .select(ORDER_FIELDS_FOR_CUSTOMER)
      .populate("items.productId", "name images price slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
