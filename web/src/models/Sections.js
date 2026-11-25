import mongoose from "mongoose";

const SectionsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    buttonText1: { type: String },
    buttonText2: { type: String },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    bannerUrl: {
      url: String,
      public_id: String,
    },

    /**
     * Optional, admin-configurable hero addons (offer badges, countdown etc.)
     * Stored as a nested object to keep schema flexible for future widgets.
     */
    addons: {
      offerEnabled: { type: Boolean, default: false },
      offerBadgeText: { type: String, default: "" },
      offerTitle: { type: String, default: "" },
      offerDiscountText: { type: String, default: "" },
      countdownEnabled: { type: Boolean, default: false },
      countdownEndsAt: { type: Date, default: null },
      countdownLabel: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Sections || mongoose.model("Sections", SectionsSchema);