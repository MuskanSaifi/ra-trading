// src/app/api/attributes/route.js

import { connectDB } from "@/lib/dbConnect";
import Attribute from "@/models/Attribute";

// ✅ GET — all attributes
export async function GET() {
  try {
    await connectDB();
    const attributes = await Attribute.find({});
    return new Response(
      JSON.stringify({ success: true, attributes }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

// ✅ POST — create attribute
export async function POST(req) {
  try {
    await connectDB();
    const { name, values } = await req.json();

    if (!name || !values)
      return new Response(
        JSON.stringify({ success: false, error: "Name & values required" }),
        { status: 400 }
      );

    const newAttr = await Attribute.create({ name, values });

    return new Response(
      JSON.stringify({ success: true, attribute: newAttr }),
      { status: 201 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
