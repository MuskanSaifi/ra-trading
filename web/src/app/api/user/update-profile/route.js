import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();

    const _id = formData.get("_id");
    if (!_id) {
      return NextResponse.json({ success: false, message: "User ID required" });
    }

    // 🔥 Text fields save
    let updates = {};
    formData.forEach((value, key) => {
      if (key !== "profilePic") updates[key] = value;
    });

    // 🔥 Image Upload Logic
    const file = formData.get("profilePic");

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "profiles" },
          (err, result) => {
            if (err) reject(err);
            else resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        ).end(buffer);
      });

      updates.profilePic = uploaded;
    }

    const user = await User.findByIdAndUpdate(_id, { $set: updates }, { new: true });

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      user,
    });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Server Error" });
  }
}
