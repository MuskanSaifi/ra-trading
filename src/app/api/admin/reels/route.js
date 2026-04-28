import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Reel from "@/models/Reel";

function toStr(v) {
  return String(v ?? "").trim();
}

function pickPayload(raw) {
  return {
    enabled: raw?.enabled !== false,
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 0,
    title: toStr(raw?.title),
    video: {
      url: toStr(raw?.video?.url || raw?.videoUrl),
      public_id: toStr(raw?.video?.public_id || raw?.videoPublicId),
    },
    poster: {
      url: toStr(raw?.poster?.url || raw?.posterUrl),
      public_id: toStr(raw?.poster?.public_id || raw?.posterPublicId),
    },
  };
}

export async function GET() {
  try {
    await connectDB();
    const reels = await Reel.find().sort({ order: -1, updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, reels });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const payload = pickPayload(body);
    if (!payload.video?.url) {
      return NextResponse.json({ success: false, error: "Video URL is required" }, { status: 400 });
    }
    const created = await Reel.create(payload);
    return NextResponse.json({ success: true, reel: created });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

