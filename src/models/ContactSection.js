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

const ContactFeatureSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    iconName: { type: String, default: "zap" },
  },
  { _id: false }
);

const TrustBadgeSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    iconName: { type: String, default: "shield" },
  },
  { _id: false }
);

const ContactItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["phone", "email", "address"],
      default: "phone",
    },
    value: { type: String, default: "" },
    note: { type: String, default: "" },
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
    badgeText: { type: String, default: "Get In Touch" },
    featureHighlights: [ContactFeatureSchema],
    contactItems: [ContactItemSchema],
    trustBadges: [TrustBadgeSchema],
    showcaseImage: {
      url: String,
      public_id: String,
    },

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
