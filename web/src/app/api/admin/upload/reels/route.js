import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { requireAdminAuth, validateFile } from "@/lib/authHelpers";

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
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
      allowedExtensions: [".mp4", ".webm", ".mov"],
    });

    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, error: fileValidation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "reels",
            resource_type: "video",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    });
  } catch (error) {
    console.error("Reels upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

