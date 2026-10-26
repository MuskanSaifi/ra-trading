import { NextResponse } from "next/server";
import {
  getIntegrationSettings,
  applyShiprocketEnvOverrides,
} from "@/lib/getIntegrationSettings";
import { getPayuEnv, getPayuKeyPreview, isPayuConfigured } from "@/lib/payu";
import {
  isShiprocketConfigured,
  getShiprocketToken,
} from "@/lib/shiprocket";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getIntegrationSettings();
    applyShiprocketEnvOverrides(settings);

    let shiprocketOk = false;
    let shiprocketError = null;
    if (isShiprocketConfigured()) {
      try {
        await getShiprocketToken(true);
        shiprocketOk = true;
      } catch (err) {
        shiprocketError = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      status: {
        payu: {
          configured: isPayuConfigured(),
          enabled: settings.payuEnabled !== false,
          env: getPayuEnv(),
          keyIdPreview: getPayuKeyPreview(),
        },
        shiprocket: {
          configured: isShiprocketConfigured(),
          connected: shiprocketOk,
          enabled: settings.shiprocketEnabled !== false,
          emailPreview: process.env.SHIPROCKET_EMAIL
            ? String(process.env.SHIPROCKET_EMAIL).replace(/(.{3}).+(@.+)/, "$1***$2")
            : null,
          error: shiprocketError,
        },
        cod: { enabled: settings.codEnabled !== false },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const settings = await getIntegrationSettings();

    const fields = [
      "shiprocketPickupLocation",
      "shiprocketPickupPincode",
      "shiprocketChannelId",
      "shiprocketBillingEmail",
      "shiprocketDefaultLength",
      "shiprocketDefaultBreadth",
      "shiprocketDefaultHeight",
      "shiprocketDefaultWeight",
      "shiprocketDefaultHsn",
      "shiprocketEnabled",
      "razorpayEnabled",
      "cashfreeEnabled",
      "payuEnabled",
      "codEnabled",
    ];

    for (const key of fields) {
      if (body[key] !== undefined) settings[key] = body[key];
    }

    await settings.save();
    applyShiprocketEnvOverrides(settings);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
