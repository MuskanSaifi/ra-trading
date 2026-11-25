import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import HomeGraphicsBlock from "@/models/HomeGraphicsBlock";
import { uploadSectionBannerBuffer } from "@/lib/sectionBannerUpload";
import { v2 as cloudinary } from "cloudinary";

function toStr(v) {
  return String(v ?? "").trim();
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickPayload(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    enabled: raw?.enabled !== false,
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 0,
    layout: ["strip", "grid", "carousel"].includes(raw?.layout) ? raw.layout : "strip",
    title: toStr(raw?.title),
    subtitle: toStr(raw?.subtitle),
    items: items.map((it) => ({
      title: toStr(it?.title),
      href: toStr(it?.href),
      image: {
        url: toStr(it?.image?.url),
        public_id: toStr(it?.image?.public_id),
      },
    })),
  };
}

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

export async function PUT(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    const existing = await HomeGraphicsBlock.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Block not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const rawData = formData.get("data");
    const parsed = parseJsonSafe(rawData);
    if (!parsed) {
      return NextResponse.json({ success: false, error: "Invalid JSON in form data" }, { status: 400 });
    }

    const payload = pickPayload(parsed);

    const nextItems = await Promise.all(
      payload.items.map(async (it, idx) => {
        const file = formData.get(`image_${idx}`);
        if (file && typeof file === "object" && "size" in file && file.size > 0) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const image = await uploadSectionBannerBuffer(buffer, "home-graphics");
          return { ...it, image };
        }
        return it;
      })
    );

    payload.items = nextItems.filter((it) => it.image?.url);

    // Cleanup: delete removed images from Cloudinary (best-effort)
    const oldIds = new Set(
      (existing.items || [])
        .map((it) => it?.image?.public_id)
        .filter(Boolean)
    );
    const newIds = new Set(payload.items.map((it) => it?.image?.public_id).filter(Boolean));
    const removed = [...oldIds].filter((pid) => !newIds.has(pid));
    if (removed.length && ensureCloudinary()) {
      await Promise.allSettled(removed.map((pid) => cloudinary.uploader.destroy(pid)));
    }

    const updated = await HomeGraphicsBlock.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, block: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const block = await HomeGraphicsBlock.findById(id);
    if (!block) {
      return NextResponse.json({ success: false, error: "Block not found" }, { status: 404 });
    }

    const ids = (block.items || []).map((it) => it?.image?.public_id).filter(Boolean);
    if (ids.length && ensureCloudinary()) {
      await Promise.allSettled(ids.map((pid) => cloudinary.uploader.destroy(pid)));
    }

    await HomeGraphicsBlock.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

