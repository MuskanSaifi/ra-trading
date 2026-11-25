import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import FAQ from "@/models/FAQ";

export async function GET() {
  try {
    await connectDB();
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, faqs });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const newFaq = await FAQ.create(body);

    return NextResponse.json({ success: true, faq: newFaq });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
