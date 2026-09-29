import { jsonResponse, handleOptions } from "@/lib/apiHelpers";
import { getContactSectionDocument } from "@/lib/getContactSectionDoc";

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

const NO_STORE = { "Cache-Control": "private, no-store" };

const defaultPayload = {
  title: "We're Here to Help Your Business Grow",
  companyName: "E-Commerce Store",
  subtitle:
    "Have questions, need a quote, or want to start your own brand? Our team is ready to assist you.",
  description: "",
  address: "India",
  phone: "+91 97169 94211",
  email: "support@example.com",
  badgeText: "Get In Touch",
  logo: { url: "" },
  favicon: { url: "" },
  socialLinks: [],
  featureHighlights: [
    { title: "Quick Response", description: "We reply within 24 hours", iconName: "zap" },
    { title: "Expert Support", description: "Get help from our experts", iconName: "briefcase" },
    { title: "Bulk & Private Label", description: "Solutions tailored for you", iconName: "package" },
    { title: "Reliable & Trusted", description: "Quality you can count on", iconName: "shield" },
  ],
  contactItems: [
    { type: "phone", value: "+91 97169 94211", note: "Mon - Sat (10:00 AM - 7:00 PM)" },
    { type: "email", value: "support@example.com", note: "We'll reply as soon as possible" },
    { type: "address", value: "India", note: "Shipping all over India" },
  ],
  trustBadges: [
    { title: "100% Secure", subtitle: "Your data is safe", iconName: "shield" },
    { title: "Trusted", subtitle: "Happy customers", iconName: "star" },
    { title: "Quality Support", subtitle: "We're here to help", iconName: "support" },
  ],
  showcaseImage: { url: "" },
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
