import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { ORDER_GROUPS } from "@/lib/orderStatus";
import { dateFilterFromParams } from "@/lib/dateRange";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function groupFilter(group) {
  if (group === "refundPending") return { paymentStatus: "Refund Pending" };
  if (ORDER_GROUPS[group]) return { status: { $in: ORDER_GROUPS[group] } };
  return {};
}

// GET ALL ORDERS (with populated product)
async function handleGET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20")), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const group = searchParams.get("group") || "all";
    const payment = searchParams.get("payment");
    const q = (searchParams.get("q") || "").trim().slice(0, 60);

    // Filters shared by the list and the tab counts (everything except the status tab)
    const base = { ...(dateFilterFromParams(searchParams) || {}) };
    if (payment === "PayU" || payment === "COD") base.paymentMode = payment;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      base.$or = [
        { "address.name": rx },
        { "address.phone": rx },
        { "address.city": rx },
        { awb: rx },
        { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: escapeRegex(q), options: "i" } } },
      ];
    }

    const query = { ...base, ...groupFilter(group) };
    if (status && status !== "all") query.status = status;

    const [total, orders, statusCounts, refundPending] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .select("items address totalAmount paymentMode paymentStatus status expectedDelivery createdAt userId awb courierName trackingUrl labelUrl shipmentId shiprocketOrderId shippedAt")
        .populate("items.productId", "name images price slug")
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.countDocuments({ ...base, paymentStatus: "Refund Pending" }),
    ]);

    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const counts = { all: statusCounts.reduce((n, s) => n + s.count, 0), refundPending };
    for (const [key, statuses] of Object.entries(ORDER_GROUPS)) {
      counts[key] = statuses.reduce((n, s) => n + (byStatus[s] || 0), 0);
    }

    return NextResponse.json({
      success: true,
      orders,
      total,
      counts,
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
async function handlePATCH(req) {
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

export const GET = requireAdminAuth(handleGET);
export const PATCH = requireAdminAuth(handlePATCH);
