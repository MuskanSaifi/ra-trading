export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import AdminSetting from "@/models/AdminSetting";
import { connectDB } from "@/lib/dbConnect";
import { requireAdminAuth } from "@/lib/authHelpers";

// 🔒 CRITICAL: This endpoint must be protected - it can change admin password!
export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();
    const { profile, security, site } = await req.json();

    let settings = await AdminSetting.findOne();

    // CREATE DEFAULT ADMIN IF NOT EXISTS
    if (!settings) {
      settings = new AdminSetting({
        siteAdminName: profile?.name || "Admin",
        siteAdminEmail: profile?.email || "admin@example.com",
        passwordHash: await bcrypt.hash(security?.password || "admin123", 10),
        twoFA: security?.twoFA || false,
        siteName: site?.siteName || "My Store",
        currency: site?.currency || "INR",
        maintenance: site?.maintenance || false,
      });

      await settings.save();

      return NextResponse.json({
        success: true,
        message: "Admin created successfully",
      });
    }

    // UPDATE EXISTING ADMIN
    if (profile?.name) settings.siteAdminName = profile.name;
    if (profile?.email) settings.siteAdminEmail = profile.email;

    if (security?.password) {
      settings.passwordHash = await bcrypt.hash(security.password, 10);
    }

    if (security?.twoFA !== undefined) {
      settings.twoFA = security.twoFA;
    }

    if (site?.siteName) settings.siteName = site.siteName;
    if (site?.currency) settings.currency = site.currency;
    if (site?.maintenance !== undefined) {
      settings.maintenance = site.maintenance;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
});
