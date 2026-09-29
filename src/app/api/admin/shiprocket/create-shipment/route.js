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

export const runtime = "nodejs";

export async function POST(req) {
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

    order.shippedAt = new Date();
    order.status = "Shipped";

    const eta = new Date();
    eta.setDate(eta.getDate() + 4);
    order.expectedDelivery = eta;

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
        actionUrl: "/user-dashboard/orders",
      });
    }

    return NextResponse.json({
      success: true,
      message: order.awb
        ? `Shipment created. AWB: ${order.awb}`
        : "Shipment created but AWB pending — use Generate AWB",
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



