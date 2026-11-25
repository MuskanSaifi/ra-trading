import mongoose from "mongoose";

const DeliveryZoneSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DeliveryZoneSchema.index(
  { country: 1, state: 1, city: 1, pincode: 1 },
  { unique: true }
);
DeliveryZoneSchema.index({ country: 1, city: 1, pincode: 1 });
DeliveryZoneSchema.index({ enabled: 1 });

export default mongoose.models.DeliveryZone ||
  mongoose.model("DeliveryZone", DeliveryZoneSchema);

