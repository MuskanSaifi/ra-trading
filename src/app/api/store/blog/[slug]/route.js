import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";

export async function GET(_req, context) {
  try {
    await connectDB();
    const { slug } = await context.params;
    const post = await BlogPost.findOne({ slug, published: true }).lean();
    if (!post) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
