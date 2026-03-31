import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { requireAdminAuth, validateFile, validateImageBuffer } from "@/lib/authHelpers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = requireAdminAuth(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const fileValidation = validateFile(file, {
      maxSize: 8 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    });

    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, error: fileValidation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bufferValidation = validateImageBuffer(buffer);
    if (!bufferValidation.valid) {
      return NextResponse.json({ success: false, error: bufferValidation.error }, { status: 400 });
    }

    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "blog" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Blog upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
