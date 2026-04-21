import mongoose from "mongoose";

const HomeGraphicItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    href: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
  },
  { _id: false }
);

const HomeGraphicsBlockSchema = new mongoose.Schema(
  {
    /** Higher priority shows first */
    order: { type: Number, default: 0 },
    /** Visual layout type */
    layout: {
      type: String,
      enum: ["strip", "grid", "carousel"],
      default: "strip",
      required: true,
    },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    items: { type: [HomeGraphicItemSchema], default: [] },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.HomeGraphicsBlock ||
  mongoose.model("HomeGraphicsBlock", HomeGraphicsBlockSchema);

