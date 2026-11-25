import { requireAdminAuth } from "@/lib/authHelpers";

import { connectDB } from "@/lib/dbConnect";
import ContactForm from "@/models/ContactForm";
import { NextResponse } from "next/server";

// GET — fetch all messages (admin only)
async function handleGET() {
  try {
    await connectDB();
    const messages = await ContactForm.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: messages });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

// ✅ POST — allow only 2 messages per phone per day
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const digitsOnly = phone ? phone.replace(/\D/g, "") : "";
    if (digitsOnly.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Check daily limit (max 2 per day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await ContactForm.countDocuments({
      phone: digitsOnly,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (countToday >= 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only send up to 2 messages per day from the same phone number.",
        },
        { status: 429 }
      );
    }

    // Save message
    const newMsg = await ContactForm.create({
      name,
      email,
      phone: digitsOnly,
      message,
    });

    return NextResponse.json({ success: true, data: newMsg });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

// DELETE — delete by ID (admin only)
async function handleDELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const deleted = await ContactForm.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

export const GET = requireAdminAuth(handleGET);
export const DELETE = requireAdminAuth(handleDELETE);
