import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import HomeGraphicsBlock from "@/models/HomeGraphicsBlock";
import { uploadSectionBannerBuffer } from "@/lib/sectionBannerUpload";

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

export async function GET() {
  try {
    await connectDB();
    const blocks = await HomeGraphicsBlock.find().sort({ order: -1, updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, blocks });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = formData.get("data");
    if (!rawData) {
      return NextResponse.json({ success: false, error: "No data provided" }, { status: 400 });
    }

    const parsed = parseJsonSafe(rawData);
    if (!parsed) {
      return NextResponse.json({ success: false, error: "Invalid JSON in form data" }, { status: 400 });
    }

    const payload = pickPayload(parsed);

    // Upload item images (image_0, image_1, ...)
    const uploadedItems = await Promise.all(
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

    payload.items = uploadedItems.filter((it) => it.image?.url);

    const created = await HomeGraphicsBlock.create(payload);
    return NextResponse.json({ success: true, block: created });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

