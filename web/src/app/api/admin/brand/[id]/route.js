// /api/admin/brand/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import Brand from "@/models/Brand";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ helper → generate slug
const generateSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ✅ GET → fetch brand
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, brand });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ✅ PUT → update brand
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const formData = await req.formData();
    const updateData = JSON.parse(formData.get("data"));

    // ✅ Auto generate slug if not provided from UI
    if (!updateData.slug && updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const file = formData.get("image");
    if (file && file.name) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const imageData = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "brands" },
          (err, result) => {
            if (err) reject(err);
            else resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(buffer);
      });

      updateData.image = imageData;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedBrand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, brand: updatedBrand });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE → delete brand
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Brand.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    if (deleted.image?.public_id) {
      cloudinary.uploader.destroy(deleted.image.public_id).catch((err) => {
        console.error("Cloudinary delete failed:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
