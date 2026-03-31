import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";
import { requireAdminAuth } from "@/lib/authHelpers";
import { normalizeBlogBlocks } from "@/lib/blogBlocks";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base) {
  const slug = base && String(base).length ? base : "post";
  let n = 0;
  while (await BlogPost.exists({ slug: n ? `${slug}-${n}` : slug })) {
    n += 1;
  }
  return n ? `${slug}-${n}` : slug;
}

function parseTags(input) {
  if (Array.isArray(input)) {
    return input.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 40);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  return [];
}

export const GET = requireAdminAuth(async () => {
  try {
    await connectDB();
    const posts = await BlogPost.find({})
      .sort({ createdAt: -1 })
      .select("title slug excerpt published createdAt banner.url")
      .lean();
    return NextResponse.json({ success: true, posts });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});

export const POST = requireAdminAuth(async (req) => {
  try {
    await connectDB();
    const body = await req.json();
    const {
      title,
      excerpt = "",
      contentHtml = "",
      author = "Admin",
      category = "",
      tags: tagsIn,
      metaTitle = "",
      metaDescription = "",
      metaKeywords = "",
      banner,
      blocks = [],
      published = true,
      slug: slugIn,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });
    }

    const slug = await uniqueSlug(slugify(slugIn || title));

    const post = await BlogPost.create({
      title: title.trim(),
      slug,
      excerpt: String(excerpt).slice(0, 2000),
      author: String(author || "Admin").slice(0, 120),
      category: String(category || "").slice(0, 120),
      tags: parseTags(tagsIn),
      metaTitle: String(metaTitle || "").slice(0, 200),
      metaDescription: String(metaDescription || "").slice(0, 500),
      metaKeywords: String(metaKeywords || "").slice(0, 500),
      contentHtml: String(contentHtml || "").slice(0, 500_000),
      banner: {
        url: banner?.url || "",
        publicId: banner?.publicId || "",
      },
      blocks: normalizeBlogBlocks(blocks),
      published: Boolean(published),
    });

    return NextResponse.json({ success: true, post });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});
