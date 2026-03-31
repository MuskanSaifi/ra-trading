// src/models/ContactSection.js
import mongoose from "mongoose";

const SocialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    icon: {
      url: String,
      public_id: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { _id: false }
);

const ContactSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    companyName: {
  type: String,
  trim: true,
},

    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },

    logo: {
      url: String,
      public_id: String,
    },
    favicon: {
      url: String,
      public_id: String,
    },

    formTitle: { type: String, default: "Contact Form" },
    formSubtitle: { type: String, default: "" },

    socialLinks: [SocialLinkSchema],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ContactSection ||
  mongoose.model("ContactSection", ContactSectionSchema);
