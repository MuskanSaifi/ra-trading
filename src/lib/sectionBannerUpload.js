import { v2 as cloudinary } from "cloudinary";

function ensureCloudinary() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload buffer to Cloudinary with a hard timeout (avoids hanging POST for tens of seconds).
 */
export async function uploadSectionBannerBuffer(buffer, folder = "banners", timeoutMs = 45000) {
  ensureCloudinary();
  const uploadOnce = () =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url)
          return reject(new Error("Cloudinary returned no image URL"));
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      });
      stream.end(buffer);
    });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Image upload timed out — check Cloudinary credentials and network")), timeoutMs)
  );

  return Promise.race([uploadOnce(), timeout]);
}
