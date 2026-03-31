import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import BlogPost from "@/models/BlogPost";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "9", 10)));
    const skip = (page - 1) * limit;

    const filter = { published: true };
    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug excerpt banner.url createdAt")
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
