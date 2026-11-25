import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer (file) to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<string>} URL
 */
export async function uploadToCloudinary(fileBuffer, folder = "products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
    stream.end(fileBuffer);
  });
}

export default cloudinary;
