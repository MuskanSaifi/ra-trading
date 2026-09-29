import { NextResponse } from "next/server";
import {
  checkShiprocketServiceability,
  isShiprocketConfigured,
} from "@/lib/shiprocket";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (!isShiprocketConfigured()) {
      return NextResponse.json(
        { success: false, message: "Shiprocket not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      deliveryPostcode,
      pickupPostcode,
      weight = 0.5,
      cod = false,
    } = body || {};

    if (!deliveryPostcode || !/^\d{6}$/.test(String(deliveryPostcode))) {
      return NextResponse.json(
        { success: false, message: "Valid 6-digit delivery pincode required" },
        { status: 400 }
      );
    }

    const data = await checkShiprocketServiceability({
      pickupPostcode,
      deliveryPostcode,
      weight,
      cod,
    });

    const available =
      Boolean(data?.data?.available_courier_companies?.length) ||
      Boolean(data?.available_courier_companies?.length);

    return NextResponse.json({
      success: true,
      available,
      data,
    });
  } catch (error) {
    console.error("Shiprocket serviceability:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Serviceability check failed" },
      { status: error.status || 500 }
    );
  }
}
