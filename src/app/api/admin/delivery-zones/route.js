export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import DeliveryZone from "@/models/DeliveryZone";
import { requireAdminAuth } from "@/lib/authHelpers";

function normalizePincode(v) {
  return String(v || "").replace(/\D/g, "").slice(0, 6);
}

export const GET = requireAdminAuth(async () => {
  try {
    await connectDB();
    const zones = await DeliveryZone.find({})
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean();
    return NextResponse.json({ success: true, zones });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
});

export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();
    const body = await req.json();
    const country = String(body.country || "India").trim();
    const state = String(body.state || "").trim();
    const city = String(body.city || "").trim();

    const raw = body.pincodes ?? body.pincode ?? "";
    const list = Array.isArray(raw)
      ? raw
      : String(raw)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

    const pincodes = list
      .map(normalizePincode)
      .filter((p) => p && p.length === 6);

    if (!country || !city) {
      return NextResponse.json(
        { success: false, message: "country and city are required" },
        { status: 400 }
      );
    }

    // If no pincodes provided, treat it as "all pincodes in this city"
    const finalPincodes = pincodes.length > 0 ? pincodes : ["*"];

    const ops = finalPincodes.map((pincode) => ({
      updateOne: {
        filter: { country, state, city, pincode },
        update: { $set: { enabled: true, country, state, city, pincode } },
        upsert: true,
      },
    }));

    const result = await DeliveryZone.bulkWrite(ops, { ordered: false });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
});

