import { requireAdminAuth } from "@/lib/authHelpers";
import { NextResponse } from "next/server";
import {
  getIntegrationSettings,
  applyShiprocketEnvOverrides,
} from "@/lib/getIntegrationSettings";
import { getPayuEnv, getPayuKeyPreview, isPayuConfigured } from "@/lib/payu";
import {
  isShiprocketConfigured,
  getShiprocketToken,
  listShiprocketPickupLocations,
} from "@/lib/shiprocket";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const settings = await getIntegrationSettings();
    applyShiprocketEnvOverrides(settings);

    let shiprocketOk = false;
    let shiprocketError = null;
    let pickupLocations = [];
    if (isShiprocketConfigured()) {
      try {
        await getShiprocketToken(true);
        shiprocketOk = true;
        pickupLocations = await listShiprocketPickupLocations().catch(() => []);
      } catch (err) {
        shiprocketError = err.message;
      }
    }
    const activePickup = settings.shiprocketPickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || "";
    if (
      shiprocketOk &&
      pickupLocations.length &&
      !pickupLocations.some((p) => p.name === activePickup)
    ) {
      shiprocketError = `Pickup location "${activePickup}" was not found in Shiprocket. Choose one of: ${pickupLocations
        .map((p) => p.name)
        .join(", ")}`;
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
          pickupLocations,
          activePickup,
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

async function handlePUT(req) {
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

export const GET = requireAdminAuth(handleGET);
export const PUT = requireAdminAuth(handlePUT);
