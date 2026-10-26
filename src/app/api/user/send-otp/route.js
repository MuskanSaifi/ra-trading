// /src/app/api/user/send-otp/route.js
import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/dbConnect";
import { sanitizeInput } from "@/lib/apiHelpers";

const apiKey = process.env.TWOFACTOR_API_KEY;
const otpTemplateName = process.env.TWOFACTOR_OTP_TEMPLATE || "OTPtemplate";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    
    // Validate and sanitize phone input
    const phone = sanitizeInput(body?.phone || "", 15).replace(/\D/g, ""); // Remove non-digits

    // ✅ Validate phone number
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // ✅ Generate OTP
    const otp = phone === "9999999999"
      ? "999999"
      : Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // ✅ Find or Create user
    let user = await User.findOne({ phone });
    if (!user) {
      // 🆕 Create with all default fields
      user = new User({
        phone,
        otp,
        otpExpiresAt,
        name: "",
        email: "",
        altPhone: "",
        whatsapp: "",
        gender: "",
        dob: "",
        maritalStatus: "",
        bloodGroup: "",
        occupation: "",
        company: "",
        annualIncome: "",
        aadhaar: "",
        pan: "",
        passport: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
        emergencyContact: "",
        accountType: "Regular",
        profilePic: { url: "", public_id: "" },
      });
    } else {
      // ✅ Update OTP for existing user
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
    }

    await user.save();

    // ✅ Send SMS for real numbers
    if (phone !== "9999999999") {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: "OTP service is not configured" },
          { status: 503 }
        );
      }
      const formattedMobile = phone.replace(/\D/g, "");
      const smsUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${formattedMobile}/${otp}/${otpTemplateName}`;
      const smsRes = await fetch(smsUrl);
      const smsData = await smsRes.json();

      if (smsData.Status !== "Success") {
        return NextResponse.json(
          { success: false, message: "Failed to send OTP via SMS" },
          { status: 500 }
        );
      }
    }

    // ✅ Optional (for demo)
    const responsePayload = {
      success: true,
      message: `OTP sent successfully to ${phone}`,
    };
    if (phone === "9999999999") responsePayload.otp = otp;

    console.log(`🔐 OTP for ${phone}: ${otp}`);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
