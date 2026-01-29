import { connectDB } from "@/lib/dbConnect";
import ContactSection from "@/models/ContactSection";
import { NextResponse } from "next/server";
import { jsonResponse, handleOptions } from "@/lib/apiHelpers";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    await connectDB();

    const data = await ContactSection.findOne().lean();

    if (!data) {
      // Return default/empty data instead of 404 to prevent errors (no hardcoded brand name)
      return jsonResponse({
        success: true,
        data: {
          title: "E-Commerce Store",
          companyName: "E-Commerce Store",
          description: "Your trusted shopping destination",
          address: "",
          phone: "",
          email: "",
          logo: { url: "" },
          favicon: { url: "" },
          socialLinks: []
        },
      }, 200, {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      });
    }

    return jsonResponse({
      success: true,
      data,
    }, 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    });

  } catch (error) {
    console.error("Contact Section GET Error:", error);

    // Return default data on error instead of failing
    return jsonResponse({
      success: true,
      data: {
        title: "E-Commerce Store",
        companyName: "E-Commerce Store",
        description: "Your trusted shopping destination",
        address: "",
        phone: "",
        email: "",
        logo: { url: "" },
        favicon: { url: "" },
        socialLinks: []
      },
    }, 200);
  }
}
