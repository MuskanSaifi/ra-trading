import { jsonResponse, handleOptions } from "@/lib/apiHelpers";
import { getContactSectionDocument } from "@/lib/getContactSectionDoc";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

const NO_STORE = { "Cache-Control": "private, no-store" };

const defaultPayload = {
  title: "E-Commerce Store",
  companyName: "E-Commerce Store",
  description: "Your trusted shopping destination",
  address: "",
  phone: "",
  email: "",
  logo: { url: "" },
  favicon: { url: "" },
  socialLinks: [],
};

export async function GET() {
  try {
    const data = await getContactSectionDocument();

    if (!data) {
      return jsonResponse({ success: true, data: defaultPayload }, 200, NO_STORE);
    }

    return jsonResponse({ success: true, data }, 200, NO_STORE);
  } catch (error) {
    console.error("Contact Section GET Error:", error);

    return jsonResponse({ success: true, data: defaultPayload }, 200, NO_STORE);
  }
}
