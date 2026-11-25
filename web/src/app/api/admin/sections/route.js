import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Banner from "@/models/Sections";
import { uploadSectionBannerBuffer } from "@/lib/sectionBannerUpload";

function pickCreatePayload(raw) {
  return {
    title: String(raw?.title ?? "").trim(),
    subtitle: String(raw?.subtitle ?? "").trim(),
    section: String(raw?.section ?? "").trim(),
    buttonText1: String(raw?.buttonText1 ?? "").trim(),
    buttonText2: String(raw?.buttonText2 ?? "").trim(),
    addons: {
      offerEnabled: Boolean(raw?.addons?.offerEnabled),
      offerBadgeText: String(raw?.addons?.offerBadgeText ?? "").trim(),
      offerTitle: String(raw?.addons?.offerTitle ?? "").trim(),
      offerDiscountText: String(raw?.addons?.offerDiscountText ?? "").trim(),
      countdownEnabled: Boolean(raw?.addons?.countdownEnabled),
      countdownEndsAt: raw?.addons?.countdownEndsAt
        ? new Date(raw.addons.countdownEndsAt)
        : null,
      countdownLabel: String(raw?.addons?.countdownLabel ?? "").trim(),
    },
  };
}

// ✅ GET → All Banners
export async function GET() {
  try {
    await connectDB();
    const banners = await Banner.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, banners });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}


// ✅ POST → Create Banner
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "No banner data provided" },
        { status: 400 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in form data" },
        { status: 400 }
      );
    }

    const bannerData = pickCreatePayload(parsed);
    if (!bannerData.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }
    if (!bannerData.section) {
      return NextResponse.json(
        { success: false, error: "Section key is required (e.g. landingpage-frontsection)" },
        { status: 400 }
      );
    }

    let imageData = null;
    const file = formData.get("image");

    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageData = await uploadSectionBannerBuffer(buffer, "banners");
    }

    if (imageData) bannerData.bannerUrl = imageData;

    const newBanner = await Banner.create(bannerData);

    return NextResponse.json({ success: true, banner: newBanner });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
