// src/app/api/attributes/[id]/route.js

import { connectDB } from "@/lib/dbConnect";
import Attribute from "@/models/Attribute";

// ✅ PUT — update attribute
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const { name, values } = await req.json();

    if (!name || !values)
      return new Response(
        JSON.stringify({ success: false, error: "Name & values required" }),
        { status: 400 }
      );

    const updated = await Attribute.findByIdAndUpdate(
      id,
      { name, values },
      { new: true }
    );

    if (!updated)
      return new Response(
        JSON.stringify({ success: false, error: "Not found" }),
        { status: 404 }
      );

    return new Response(
      JSON.stringify({ success: true, attribute: updated }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

// ✅ DELETE — delete attribute
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await Attribute.findByIdAndDelete(id);

    if (!deleted)
      return new Response(
        JSON.stringify({ success: false, error: "Not found" }),
        { status: 404 }
      );

    return new Response(
      JSON.stringify({ success: true, message: "Deleted successfully" }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
