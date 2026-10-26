import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyUser } from "@/lib/notificationHelper";
import {
  assignShiprocketAwb,
  isShiprocketConfigured,
} from "@/lib/shiprocket";
import { recordStatus } from "@/lib/orderLifecycle";
import { CANCELLABLE_STATUSES } from "@/lib/orderStatus";

export const runtime = "nodejs";

/**
 * Generate/assign AWB for an order that already has Shiprocket shipmentId,
 * OR save a manually entered AWB.
 *
 * Body:
 *  - orderId (required)
 *  - courierId (optional)
 *  - awb (optional) — if provided, saves manual AWB without calling Shiprocket
 */
async function handlePOST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, courierId, awb: manualAwb, courierName: manualCourier } = body || {};

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentMode === "PayU" && order.paymentStatus !== "Paid") {
      return NextResponse.json(
        { success: false, message: "Cannot assign AWB to an unpaid online order" },
        { status: 400 }
      );
    }

    if (String(order.status || "").includes("Cancel")) {
      return NextResponse.json(
        { success: false, message: "Cannot assign AWB to cancelled order" },
        { status: 400 }
      );
    }

    // Manual AWB entry
    if (manualAwb && String(manualAwb).trim()) {
      const awb = String(manualAwb).trim();
      order.awb = awb;
      order.courierName = manualCourier || order.courierName || "Manual";
      order.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
      if (!order.shippedAt) order.shippedAt = new Date();
      if (CANCELLABLE_STATUSES.includes(order.status)) {
        recordStatus(order, "Shipped", `Shipped via ${order.courierName} · AWB ${awb}`);
      }
      await order.save();

      return NextResponse.json({
        success: true,
        message: "AWB saved",
        order,
        shipment: {
          awb: order.awb,
          courierName: order.courierName,
          trackingUrl: order.trackingUrl,
        },
      });
    }

    if (!isShiprocketConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Shiprocket not configured. Add SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD",
        },
        { status: 503 }
      );
    }

    if (!order.shipmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "No Shiprocket shipment yet. Click “Ship via Shiprocket” first.",
        },
        { status: 400 }
      );
    }

    if (order.awb) {
      return NextResponse.json(
        {
          success: false,
          message: "AWB already assigned",
          shipment: {
            awb: order.awb,
            trackingUrl: order.trackingUrl,
            courierName: order.courierName,
          },
        },
        { status: 400 }
      );
    }

    const assigned = await assignShiprocketAwb(order.shipmentId, courierId);

    order.awb = assigned.awb;
    order.courierName = assigned.courierName || order.courierName;
    order.trackingUrl = assigned.trackingUrl;
    order.labelUrl = assigned.labelUrl || order.labelUrl;
    if (!order.shippedAt) order.shippedAt = new Date();
    recordStatus(
      order,
      "Shipped",
      `Shipped via ${order.courierName || "courier"} · AWB ${order.awb}`
    );

    await order.save();

    const user = await User.findById(order.userId).lean();
    if (user) {
      await notifyUser({
        userId: user._id,
        title: "AWB Generated",
        message: `Your order #${order._id} AWB: ${assigned.awb}${assigned.courierName ? ` (${assigned.courierName})` : ""}`,
        type: "order",
        priority: "high",
        relatedId: order._id,
        relatedType: "order",
        actionUrl: "/user-dashboard/orders",
      });
    }

    return NextResponse.json({
      success: true,
      message: "AWB generated successfully",
      order,
      shipment: assigned,
    });
  } catch (error) {
    console.error("Shiprocket assign-awb:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate AWB",
        details: error.data || null,
      },
      { status: error.status || 500 }
    );
  }
}

export const POST = requireAdminAuth(handlePOST);
