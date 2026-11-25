import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { v2 as cloudinary } from "cloudinary";
import ContactSection from "@/models/ContactSection";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file, folder) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }).end(buffer);
  });
}

export async function PUT(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: "No contact data provided" },
        { status: 400 }
      );
    }

    let data = JSON.parse(rawData);

    // ================= LOGO UPLOAD =================
    const logo = formData.get("logo");
    if (logo && logo.size > 0) {
      const uploaded = await uploadToCloudinary(logo, "contact-section");

      data.logo = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    // ================= FAVICON UPLOAD =================
    const favicon = formData.get("favicon");
    if (favicon && favicon.size > 0) {
      const uploaded = await uploadToCloudinary(favicon, "contact-section");

      data.favicon = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const showcaseImage = formData.get("showcaseImage");
    if (showcaseImage && showcaseImage.size > 0) {
      const uploaded = await uploadToCloudinary(showcaseImage, "contact-section");
      data.showcaseImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    // ================= SOCIAL ICONS =================
    if (data.socialLinks && Array.isArray(data.socialLinks)) {
      for (let i = 0; i < data.socialLinks.length; i++) {
        const iconFile = formData.get(`socialIcon_${i}`);

        if (iconFile && iconFile.size > 0) {
          const uploaded = await uploadToCloudinary(iconFile, "social-icons");

          data.socialLinks[i].icon = {
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
          };
        }
      }
    }

    // ✅ SAFE UPDATE (NO VERSION ERROR EVER)
    const latest = await ContactSection.findOne().sort({ updatedAt: -1 }).select("_id");

    const updatedSection = latest
      ? await ContactSection.findByIdAndUpdate(
          latest._id,
          { $set: data },
          { new: true, strict: false }
        )
      : await ContactSection.create(data);

    return NextResponse.json({
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    console.error("Contact Update Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
