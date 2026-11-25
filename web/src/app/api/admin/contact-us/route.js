import { NextResponse } from "next/server";
import ContactSection from "@/models/ContactSection";
import { connectDB } from "@/lib/dbConnect";

export async function GET() {
  try {
    await connectDB();

    const data = await ContactSection.findOne().sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    let existing = await ContactSection.findOne().sort({ updatedAt: -1 });

    let saved;

    if (existing) {
      saved = await ContactSection.findByIdAndUpdate(existing._id, body, {
        new: true,
      });
    } else {
      saved = await ContactSection.create(body);
    }

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
