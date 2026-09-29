import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";

// GET ALL ORDERS (with populated product)
export async function GET(req) {
  try {
    await connectDB();

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    // Limit max to 100 to prevent excessive data transfer
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    // Build query
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    // Get total count
    const total = await Order.countDocuments(query);

    // Fetch orders with pagination, lean, and field selection (reduces data transfer)
    const orders = await Order.find(query)
      .select("items address totalAmount paymentMode paymentStatus status expectedDelivery createdAt userId awb courierName trackingUrl labelUrl shipmentId shiprocketOrderId shippedAt")
      .populate("items.productId", "name images price slug") // Added slug for navigation
      .populate("userId", "name email phone")
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
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate' // Admin data should not be cached
      }
    });
  } catch (err) {
    console.error("âŒ Get Admin Orders Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// UPDATE ORDER STATUS
export async function PATCH(req) {
  try {
    await connectDB();

    const { orderId, status } = await req.json();

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("âŒ Update Status Error:", err);
    return NextResponse.json(
      { success: false, message: "Status update failed" },
      { status: 500 }
    );
  }
}

