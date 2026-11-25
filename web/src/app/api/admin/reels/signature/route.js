import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdminAuth } from "@/lib/authHelpers";

function toStr(v) {
  return String(v ?? "").trim();
}

function signCloudinaryParams(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export const GET = requireAdminAuth(async () => {
  const cloudName = toStr(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = toStr(process.env.CLOUDINARY_API_KEY);
  const apiSecret = toStr(process.env.CLOUDINARY_API_SECRET);
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ success: false, error: "Cloudinary env not configured" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: "reels",
    timestamp,
  };

  const signature = signCloudinaryParams(paramsToSign, apiSecret);
  return NextResponse.json({
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: "reels",
  });
});

