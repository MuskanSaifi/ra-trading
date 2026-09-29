import mongoose from "mongoose";

const IntegrationSettingsSchema = new mongoose.Schema(
  {
    // Shiprocket non-secret settings (credentials stay in .env)
    shiprocketPickupLocation: { type: String, default: "Primary" },
    shiprocketPickupPincode: { type: String, default: "" },
    shiprocketChannelId: { type: String, default: "" },
    shiprocketBillingEmail: { type: String, default: "" },
    shiprocketDefaultLength: { type: Number, default: 20 },
    shiprocketDefaultBreadth: { type: Number, default: 15 },
    shiprocketDefaultHeight: { type: Number, default: 10 },
    shiprocketDefaultWeight: { type: Number, default: 0.5 },
    shiprocketDefaultHsn: { type: Number, default: 3305 },
    shiprocketEnabled: { type: Boolean, default: true },

    razorpayEnabled: { type: Boolean, default: true },
    cashfreeEnabled: { type: Boolean, default: true },
    codEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.IntegrationSettings ||
  mongoose.model("IntegrationSettings", IntegrationSettingsSchema);
