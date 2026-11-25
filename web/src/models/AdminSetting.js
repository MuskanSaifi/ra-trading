import mongoose from "mongoose";

const AdminSettingSchema = new mongoose.Schema(
  {
    siteAdminName: { type: String, default: "Admin User" },
    siteAdminEmail: { type: String, default: "admin@example.com" },

    passwordHash: { type: String, required: true },
    twoFA: { type: Boolean, default: false },

    siteName: { type: String, default: "My Store" },
    currency: { type: String, default: "INR" },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.AdminSetting ||
  mongoose.model("AdminSetting", AdminSettingSchema);
