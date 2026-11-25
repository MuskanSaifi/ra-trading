import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product"; // needed for populate

// ✅ Get wishlist products (full product objects)
// ✅ Get wishlist products (full product objects)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId missing" },
        { status: 400 }
      );
    }

    // Optimize: Select only needed fields to reduce data transfer (mobile app optimization)
    const items = await Wishlist.find({ userId })
      .populate({
        path: "productId",
        model: Product,
        select: "name slug price salePrice discount images stock category brand", // Only essential fields
        populate: {
          path: "category",
          select: "slug name",  // ⭐ slug मिल जाएगा
        },
      })
      .lean();

    const products = items
      .map((it) => it.productId)
      .filter(Boolean);

    return NextResponse.json({ success: true, wishlist: products });
  } catch (error) {
    console.error("❌ Wishlist GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}


// ✅ Add to wishlist
export async function POST(req) {
  try {
    await connectDB();

    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    // upsert-style: अगर already है तो कुछ मत करो
    await Wishlist.updateOne(
      { userId, productId },
      { userId, productId },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Wishlist POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Remove from wishlist
export async function DELETE(req) {
  try {
    await connectDB();

    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    await Wishlist.deleteOne({ userId, productId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Wishlist DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
