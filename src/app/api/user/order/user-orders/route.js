// /app/api/user/order/user-orders/route.js
import { NextResponse } from "next/server";
import Order from "@/models/Order";
import { connectDB } from "@/lib/dbConnect";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  // Limit max to 50 to prevent excessive data transfer
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const skip = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ success: false, message: "UserId missing" });
  }

  try {
    // Get total count
    const total = await Order.countDocuments({ userId });

    // âœ… Populate product details inside items with pagination, lean, and field selection
    const orders = await Order.find({ userId })
      .select("items address totalAmount paymentMode paymentStatus status expectedDelivery createdAt awb courierName trackingUrl")
      .populate("items.productId", "name images price slug") // Added slug for mobile app navigation
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
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

