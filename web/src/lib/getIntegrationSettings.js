import { connectDB } from "@/lib/dbConnect";
import IntegrationSettings from "@/models/IntegrationSettings";

export async function getIntegrationSettings() {
  await connectDB();
  let doc = await IntegrationSettings.findOne().sort({ updatedAt: -1 });
  if (!doc) {
    doc = await IntegrationSettings.create({});
  }
  return doc;
}

export function applyShiprocketEnvOverrides(settings) {
  if (!settings) return;
  if (settings.shiprocketPickupLocation) {
    process.env.SHIPROCKET_PICKUP_LOCATION = settings.shiprocketPickupLocation;
  }
  if (settings.shiprocketPickupPincode) {
    process.env.SHIPROCKET_PICKUP_PINCODE = settings.shiprocketPickupPincode;
  }
  if (settings.shiprocketChannelId) {
    process.env.SHIPROCKET_CHANNEL_ID = settings.shiprocketChannelId;
  }
  if (settings.shiprocketBillingEmail) {
    process.env.SHIPROCKET_BILLING_EMAIL = settings.shiprocketBillingEmail;
  }
  if (settings.shiprocketDefaultLength) {
    process.env.SHIPROCKET_DEFAULT_LENGTH = String(settings.shiprocketDefaultLength);
  }
  if (settings.shiprocketDefaultBreadth) {
    process.env.SHIPROCKET_DEFAULT_BREADTH = String(settings.shiprocketDefaultBreadth);
  }
  if (settings.shiprocketDefaultHeight) {
    process.env.SHIPROCKET_DEFAULT_HEIGHT = String(settings.shiprocketDefaultHeight);
  }
  if (settings.shiprocketDefaultWeight) {
    process.env.SHIPROCKET_DEFAULT_WEIGHT = String(settings.shiprocketDefaultWeight);
  }
  if (settings.shiprocketDefaultHsn) {
    process.env.SHIPROCKET_DEFAULT_HSN = String(settings.shiprocketDefaultHsn);
  }
}
