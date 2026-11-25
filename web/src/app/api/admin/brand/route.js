// api/admin/brand/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import Brand from "@/models/Brand";

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ GET → All Brands
export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, brands });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ✅ POST → Create Brand
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "No brand data provided" },
        { status: 400 }
      );
    }

    const brandData = JSON.parse(rawData);

    let imageData = null;
    const file = formData.get("image");

    // ✅ Upload image only if exists
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      imageData = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "brands" },
          (err, result) => {
            if (err) reject(err);
            else resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        stream.end(buffer);
      });
    }

    // ✅ Add image to brandData
    if (imageData) brandData.image = imageData;

    const newBrand = await Brand.create(brandData);

    return NextResponse.json({ success: true, brand: newBrand });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
