import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Sections from "@/models/Sections";
import { v2 as cloudinary } from "cloudinary";
import { uploadSectionBannerBuffer } from "@/lib/sectionBannerUpload";

function pickUpdatePayload(raw) {
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

// ✅ UPDATE SECTION
export async function PUT(req, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const formData = await req.formData();
    const rawData = formData.get("data");
    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in form data" },
        { status: 400 }
      );
    }

    const sectionData = pickUpdatePayload(parsed);
    if (!sectionData.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }
    if (!sectionData.section) {
      return NextResponse.json(
        { success: false, error: "Section key is required" },
        { status: 400 }
      );
    }

    const file = formData.get("image");
    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      sectionData.bannerUrl = await uploadSectionBannerBuffer(buffer, "sections");
    }

    const updated = await Sections.findByIdAndUpdate(id, sectionData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, section: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE SECTION
export async function DELETE(req, context) {
  try {
    await connectDB();
    const { id } = await context.params; // ✅ IMPORTANT

    const section = await Sections.findById(id);

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    if (section.bannerUrl?.public_id) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        await cloudinary.uploader.destroy(section.bannerUrl.public_id);
      }
    }

    await Sections.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Section Deleted" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
