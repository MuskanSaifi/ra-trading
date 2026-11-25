// src/app/api/admin/products/bulk-update/route.js
import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/Product";

export async function PUT(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { ids, flags } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No product IDs provided" }),
        { status: 400 }
      );
    }

    if (!flags || typeof flags !== "object") {
      return new Response(
        JSON.stringify({ success: false, error: "No update data provided" }),
        { status: 400 }
      );
    }

    // Update multiple products
    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: flags }
    );

    return new Response(
      JSON.stringify({ success: true, updatedCount: result.modifiedCount }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Bulk update error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}