import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { extractPublicIdsFromHtml } from "@/lib/blogHtml";

/**
 * Collect unique Cloudinary public_ids from a blog post (banner, legacy blocks, rich HTML).
 */
export function collectBlogImagePublicIds(doc) {
  const ids = new Set();
  if (doc?.banner?.publicId) ids.add(doc.banner.publicId);
  for (const b of doc?.blocks || []) {
    if (b.type === "img" && b.publicId) ids.add(b.publicId);
  }
  for (const pid of extractPublicIdsFromHtml(doc?.contentHtml)) {
    ids.add(pid);
  }
  return [...ids];
}

export async function destroyCloudinaryAssets(publicIds) {
  const results = [];
  for (const pid of publicIds) {
    if (!pid || typeof pid !== "string") continue;
    try {
      const r = await cloudinary.uploader.destroy(pid);
      results.push({ publicId: pid, result: r.result });
    } catch (e) {
      results.push({ publicId: pid, error: e.message });
    }
  }
  return results;
}
