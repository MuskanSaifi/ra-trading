import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/authHelpers";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import { ORDER_GROUPS } from "@/lib/orderStatus";

export const runtime = "nodejs";

const LOW_STOCK_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const NOT_PLACED = ORDER_GROUPS.payment;
const NO_REVENUE = [...ORDER_GROUPS.payment, ...ORDER_GROUPS.cancelled];

function parseRange(searchParams) {
  const from = searchParams.get("from") ? new Date(searchParams.get("from")) : null;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")) : null;
  return {
    from: from && !Number.isNaN(from.getTime()) ? from : null,
    to: to && !Number.isNaN(to.getTime()) ? to : null,
  };
}

function createdIn({ from, to }) {
  if (!from && !to) return {};
  return { createdAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } };
}

async function orderSummary(range) {
  const [row] = await Order.aggregate([
    { $match: { ...createdIn(range), status: { $nin: NOT_PLACED } } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        cancelled: { $sum: { $cond: [{ $in: ["$status", ORDER_GROUPS.cancelled] }, 1, 0] } },
        revenue: {
          $sum: { $cond: [{ $in: ["$status", NO_REVENUE] }, 0, { $ifNull: ["$totalAmount", 0] }] },
        },
        codRevenue: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$paymentMode", "COD"] }, { $not: [{ $in: ["$status", NO_REVENUE] }] }] },
              { $ifNull: ["$totalAmount", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);
  const orders = row?.orders || 0;
  const cancelled = row?.cancelled || 0;
  const revenue = row?.revenue || 0;
  return {
    orders,
    cancelled,
    revenue,
    codRevenue: row?.codRevenue || 0,
    onlineRevenue: revenue - (row?.codRevenue || 0),
    avgOrderValue: orders - cancelled > 0 ? revenue / (orders - cancelled) : 0,
  };
}

function pctChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

async function handleGET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = parseRange(searchParams);

    // Chart window: the selected range, or the last 30 days for "all time"
    const chartTo = range.to || new Date();
    const chartFrom = range.from || new Date(chartTo.getTime() - 29 * DAY_MS);
    const spanDays = Math.min(92, Math.max(1, Math.floor((chartTo - chartFrom) / DAY_MS) + 1));

    const previous =
      range.from && range.to
        ? { from: new Date(range.from.getTime() - (range.to - range.from)), to: new Date(range.from.getTime() - 1) }
        : null;

    const [
      summary,
      prevSummary,
      byStatus,
      series,
      newCustomers,
      prevCustomers,
      totalCustomers,
      toShip,
      awaitingPayment,
      refundsPending,
      totalProducts,
      outOfStock,
      lowStockCount,
      lowStockItems,
      recentOrders,
    ] = await Promise.all([
      orderSummary(range),
      previous ? orderSummary(previous) : null,
      Order.aggregate([
        { $match: createdIn(range) },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: chartFrom, $lte: chartTo },
            status: { $nin: NO_REVENUE },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.countDocuments(createdIn(range)),
      previous ? User.countDocuments(createdIn(previous)) : null,
      User.countDocuments({}),
      Order.countDocuments({
        status: { $in: ORDER_GROUPS.toShip },
        $or: [{ paymentMode: "COD" }, { paymentStatus: "Paid" }],
      }),
      Order.countDocuments({ status: "Payment Pending" }),
      Order.countDocuments({ paymentStatus: "Refund Pending" }),
      Product.countDocuments({}),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Product.countDocuments({ stock: { $gt: 0, $lt: LOW_STOCK_LIMIT } }),
      Product.find({ stock: { $lt: LOW_STOCK_LIMIT } })
        .select("name stock images slug")
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      Order.find({ status: { $nin: NOT_PLACED } })
        .select("totalAmount status paymentMode paymentStatus createdAt address.name address.city items")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // Fill missing days so the chart has a bar per day
    const byDay = Object.fromEntries(series.map((s) => [s._id, s]));
    const days = [];
    for (let i = spanDays - 1; i >= 0; i--) {
      const d = new Date(chartTo.getTime() - i * DAY_MS);
      const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      days.push({ date: key, revenue: byDay[key]?.revenue || 0, orders: byDay[key]?.orders || 0 });
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          ...summary,
          newCustomers,
          change: previous
            ? {
                revenue: pctChange(summary.revenue, prevSummary.revenue),
                orders: pctChange(summary.orders, prevSummary.orders),
                newCustomers: pctChange(newCustomers, prevCustomers),
              }
            : null,
        },
        actions: { toShip, awaitingPayment, refundsPending },
        statusBreakdown: Object.fromEntries(byStatus.map((s) => [s._id || "Unknown", s.count])),
        series: days,
        catalog: { totalProducts, outOfStock, lowStock: lowStockCount, lowStockItems, lowStockLimit: LOW_STOCK_LIMIT },
        totals: { customers: totalCustomers },
        recentOrders: recentOrders.map((o) => ({
          _id: o._id,
          totalAmount: o.totalAmount,
          status: o.status,
          paymentMode: o.paymentMode,
          createdAt: o.createdAt,
          customer: o.address?.name || "",
          city: o.address?.city || "",
          itemCount: (o.items || []).reduce((n, i) => n + Number(i.quantity || 0), 0),
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("Dashboard stats:", err);
    return NextResponse.json({ success: false, message: "Could not load stats" }, { status: 500 });
  }
}

export const GET = requireAdminAuth(handleGET);
