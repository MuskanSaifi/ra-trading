import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import { notifyUser } from "@/lib/notificationHelper";
import {
  createShiprocketShipment,
  assignShiprocketAwb,
  isShiprocketConfigured,
} from "@/lib/shiprocket";
import {
  getIntegrationSettings,
  applyShiprocketEnvOverrides,
} from "@/lib/getIntegrationSettings";
import { recordStatus, schedulePickup } from "@/lib/orderLifecycle";

export const runtime = "nodejs";

async function handlePOST(req) {
  try {
    const settings = await getIntegrationSettings();
    applyShiprocketEnvOverrides(settings);
    if (settings.shiprocketEnabled === false) {
      return NextResponse.json(
        { success: false, message: "Shiprocket is disabled in Integrations settings" },
        { status: 403 }
      );
    }

    if (!isShiprocketConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shiprocket not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env",
        },
        { status: 503 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { orderId, pickupLocation, courierId } = body || {};
    const resolvedPickup = pickupLocation || settings.shiprocketPickupLocation || undefined;

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

    if (order.awb) {
      return NextResponse.json(
        {
          success: false,
          message: "AWB already exists for this order",
          shipment: {
            awb: order.awb,
            shipmentId: order.shipmentId,
            trackingUrl: order.trackingUrl,
            courierName: order.courierName,
          },
        },
        { status: 400 }
      );
    }

    if (order.paymentMode === "PayU" && order.paymentStatus !== "Paid") {
      return NextResponse.json(
        { success: false, message: "Cannot ship an unpaid online order" },
        { status: 400 }
      );
    }

    if (String(order.status || "").includes("Cancel")) {
      return NextResponse.json(
        { success: false, message: "Cannot ship a cancelled order" },
        { status: 400 }
      );
    }

    const user = await User.findById(order.userId).lean();
    let shipment;

    // If shipment already created but AWB missing → only generate AWB
    if (order.shipmentId) {
      shipment = await assignShiprocketAwb(order.shipmentId, courierId);
      order.awb = shipment.awb;
      order.courierName = shipment.courierName || order.courierName;
      order.trackingUrl = shipment.trackingUrl;
      order.labelUrl = shipment.labelUrl || order.labelUrl;
    } else {
      shipment = await createShiprocketShipment({
        order,
        user,
        pickupLocation: resolvedPickup,
        courierId,
      });

      order.shiprocketOrderId = shipment.shiprocketOrderId || order.shiprocketOrderId;
      order.shipmentId = shipment.shipmentId || order.shipmentId;
      order.awb = shipment.awb || order.awb;
      order.courierName = shipment.courierName || order.courierName;
      order.trackingUrl = shipment.trackingUrl || order.trackingUrl;
      order.labelUrl = shipment.labelUrl || order.labelUrl;

      // Force AWB if still missing but we have shipmentId
      if (!order.awb && order.shipmentId) {
        try {
          const assigned = await assignShiprocketAwb(order.shipmentId, courierId);
          order.awb = assigned.awb;
          order.courierName = assigned.courierName || order.courierName;
          order.trackingUrl = assigned.trackingUrl;
          order.labelUrl = assigned.labelUrl || order.labelUrl;
          shipment = { ...shipment, ...assigned };
        } catch (err) {
          console.warn("Post-create AWB retry failed:", err.message);
        }
      }
    }

    let pickup = null;
    if (order.awb) {
      order.shippedAt = new Date();
      pickup = await schedulePickup(order);
      recordStatus(
        order,
        "Shipped",
        `Shipped via ${order.courierName || "courier"} · AWB ${order.awb}${
          pickup.ok && pickup.scheduledDate ? ` · pickup ${pickup.scheduledDate}` : ""
        }`
      );
    } else {
      recordStatus(order, "Packed", "Shipment booked on Shiprocket, awaiting AWB");
    }

    await order.save();

    if (user) {
      await notifyUser({
        userId: user._id,
        title: "Order Shipped",
        message: order.awb
          ? `Your order #${order._id} has been shipped. AWB: ${order.awb}`
          : `Your order #${order._id} has been handed to Shiprocket for dispatch.`,
        type: "order",
        priority: "high",
        relatedId: order._id,
        relatedType: "order",
        actionUrl: `/user-dashboard/orders/${order._id}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: !order.awb
        ? "Shipment created but AWB pending — use Get AWB"
        : pickup?.ok
          ? `Shipment created. AWB: ${order.awb}. Courier pickup requested${
              pickup.scheduledDate ? ` for ${pickup.scheduledDate}` : ""
            }.`
          : `Shipment created. AWB: ${order.awb}. Pickup request failed: ${pickup?.message}. Use Request pickup on the order page.`,
      order,
      shipment,
    });
  } catch (error) {
    console.error("Shiprocket create-shipment:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create shipment",
        details: error.data || null,
      },
      { status: error.status || 500 }
    );
  }
}

export const POST = requireAdminAuth(handlePOST);
