import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-demand ISR Revalidation API
 * Call this endpoint to revalidate specific pages after data changes
 * 
 * Usage:
 * POST /api/revalidate?path=/category/electronics&secret=YOUR_SECRET
 * POST /api/revalidate?tag=products&secret=YOUR_SECRET
 */

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const path = searchParams.get("path");
    const tag = searchParams.get("tag");

    // Verify secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate by path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        path,
        now: Date.now(),
      });
    }

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        tag,
        now: Date.now(),
      });
    }

    return NextResponse.json(
      { message: "Missing path or tag parameter" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: `Error revalidating: ${err.message}` },
      { status: 500 }
    );
  }
}
