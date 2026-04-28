import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Reel from "@/models/Reel";
import { v2 as cloudinary } from "cloudinary";

function ensureCloudinary() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return false;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}

function toStr(v) {
  return String(v ?? "").trim();
}

function pickPayload(raw) {
  return {
    enabled: raw?.enabled !== false,
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 0,
    title: toStr(raw?.title),
    video: { url: toStr(raw?.video?.url || raw?.videoUrl) },
    poster: { url: toStr(raw?.poster?.url || raw?.posterUrl) },
  };
}

export async function PUT(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const existing = await Reel.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }
    const body = await req.json();
    const payload = pickPayload(body);
    if (!payload.video?.url) {
      return NextResponse.json({ success: false, error: "Video URL is required" }, { status: 400 });
    }
    const updated = await Reel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return NextResponse.json({ success: true, reel: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const existing = await Reel.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    const videoPid = String(existing.video?.public_id || "").trim();
    if (videoPid && ensureCloudinary()) {
      await cloudinary.uploader.destroy(videoPid, { resource_type: "video" });
    }
    await Reel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

