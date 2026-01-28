// ✅ src/app/api/admin/categories/route.js

import { NextResponse } from "next/server";
import Category from "@/models/Category";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ GET -> All categories
export const GET = requireAdminAuth(async () => {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

// ✅ POST -> Add new category
export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const categoryData = JSON.parse(formData.get("data"));

    const file = formData.get("image");
    if (file && file.name && file.size > 0) {
      // Validate file
      const fileValidation = validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      });

      if (!fileValidation.valid) {
        return NextResponse.json(
          { success: false, error: fileValidation.error },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Validate image buffer
      const bufferValidation = validateImageBuffer(buffer);
      if (!bufferValidation.valid) {
        return NextResponse.json(
          { success: false, error: bufferValidation.error },
          { status: 400 }
        );
      }

      const imageData = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "categories" },
          (err, result) => {
            if (err) reject(err);
            else resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(buffer);
      });
      categoryData.image = imageData;
    }

    const newCategory = await Category.create(categoryData);
    return NextResponse.json({ success: true, category: newCategory });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});


