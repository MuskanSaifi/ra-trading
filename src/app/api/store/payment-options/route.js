import { NextResponse } from "next/server";
import { getIntegrationSettings } from "@/lib/getIntegrationSettings";
import { isCashfreeConfigured } from "@/lib/cashfree";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getIntegrationSettings();
    const configured = isCashfreeConfigured();
    const enabled =
      settings.cashfreeEnabled !== false && settings.razorpayEnabled !== false;

    return NextResponse.json({
      success: true,
      cashfreeEnabled: enabled && configured,
      cashfreeConfigured: configured,
      razorpayEnabled: enabled && configured,
      codEnabled: settings.codEnabled !== false,
    });
  } catch {
    const configured = isCashfreeConfigured();
    return NextResponse.json({
      success: true,
      cashfreeEnabled: configured,
      cashfreeConfigured: configured,
      razorpayEnabled: configured,
      codEnabled: true,
    });
  }
}
