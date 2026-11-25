import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";
import { requireAdminAuth } from "@/lib/authHelpers";
import { collectBlogImagePublicIds, destroyCloudinaryAssets } from "@/lib/blogImages";
import { normalizeBlogBlocks } from "@/lib/blogBlocks";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const GET = requireAdminAuth(async (_req, context) => {
  try {
    await connectDB();
    const { id } = await context.params;
    const post = await BlogPost.findById(id).lean();
    if (!post) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});

export const PATCH = requireAdminAuth(async (req, context) => {
  try {
    await connectDB();
    const { id } = await context.params;
    const post = await BlogPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      excerpt,
      contentHtml,
      author,
      category,
      tags: tagsIn,
      metaTitle,
      metaDescription,
      metaKeywords,
      banner,
      blocks,
      published,
      slug: slugIn,
    } = body;

    if (title != null) post.title = String(title).trim();
    if (excerpt != null) post.excerpt = String(excerpt).slice(0, 2000);
    if (contentHtml != null) post.contentHtml = String(contentHtml).slice(0, 500_000);
    if (author != null) post.author = String(author).slice(0, 120);
    if (category != null) post.category = String(category).slice(0, 120);
    if (tagsIn != null) {
      post.tags = Array.isArray(tagsIn)
        ? tagsIn.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 40)
        : String(tagsIn)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 40);
    }
    if (metaTitle != null) post.metaTitle = String(metaTitle).slice(0, 200);
    if (metaDescription != null) post.metaDescription = String(metaDescription).slice(0, 500);
    if (metaKeywords != null) post.metaKeywords = String(metaKeywords).slice(0, 500);
    if (typeof published === "boolean") post.published = published;
    if (blocks != null) post.blocks = normalizeBlogBlocks(blocks);

    if (banner != null) {
      const oldBannerId = post.banner?.publicId;
      post.banner = {
        url: banner.url ?? post.banner?.url ?? "",
        publicId: banner.publicId ?? post.banner?.publicId ?? "",
      };
      if (oldBannerId && oldBannerId !== post.banner.publicId) {
        await destroyCloudinaryAssets([oldBannerId]);
      }
    }

    if (slugIn != null && String(slugIn).trim() && String(slugIn).trim() !== post.slug) {
      const base = slugify(slugIn);
      let slug = base;
      let n = 0;
      while (await BlogPost.exists({ slug: n ? `${slug}-${n}` : slug, _id: { $ne: post._id } })) {
        n += 1;
      }
      post.slug = n ? `${slug}-${n}` : slug;
    }

    await post.save();
    return NextResponse.json({ success: true, post });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});

export const DELETE = requireAdminAuth(async (_req, context) => {
  try {
    await connectDB();
    const { id } = await context.params;
    const post = await BlogPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const publicIds = collectBlogImagePublicIds(post.toObject());
    await BlogPost.deleteOne({ _id: id });
    await destroyCloudinaryAssets(publicIds);

    return NextResponse.json({ success: true, deletedImages: publicIds.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});
