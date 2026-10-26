import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Order from "@/models/Order";
import { connectDB } from "@/lib/dbConnect";
import { isShiprocketConfigured, trackShiprocketByAwb } from "@/lib/shiprocket";

export const runtime = "nodejs";

/** Courier scan history for a customer's own order. */
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(String(orderId))) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = await Order.findOne({ _id: orderId, userId }).select("awb").lean();
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (!order.awb || !isShiprocketConfigured()) {
      return NextResponse.json({ success: true, events: [] });
    }

    const data = await trackShiprocketByAwb(order.awb);
    const tracking = data?.tracking_data || data?.[order.awb]?.tracking_data || {};
    const events = (tracking.shipment_track_activities || []).map((a) => ({
      at: a.date,
      status: a.activity || a["sr-status-label"] || a.status,
      location: a.location || "",
    }));

    return NextResponse.json({
      success: true,
      currentStatus: tracking.shipment_track?.[0]?.current_status || null,
      etd: tracking.etd || null,
      events,
    });
  } catch (error) {
    console.error("User track:", error.message);
    return NextResponse.json({ success: true, events: [], unavailable: true });
  }
}
