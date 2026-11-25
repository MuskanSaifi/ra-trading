import { NextResponse } from "next/server";
import FAQ from "@/models/FAQ";
import { connectDB } from "@/lib/dbConnect";

export async function PUT(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await req.json();

    const faq = await FAQ.findByIdAndUpdate(id, body, { new: true });

    return NextResponse.json({ success: true, faq });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    await FAQ.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "FAQ deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
