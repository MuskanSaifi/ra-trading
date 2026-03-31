import { connectDB } from "@/lib/dbConnect";
import ContactSection from "@/models/ContactSection";

function trimStr(v) {
  if (v == null) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}

/**
 * Normalize contact section fields (trim emails/phones, safe strings for API/UI).
 */
export function normalizeContactSectionDoc(doc) {
  if (!doc) return null;
  return {
    ...doc,
    title: trimStr(doc.title),
    subtitle: trimStr(doc.subtitle),
    description: trimStr(doc.description),
    companyName: trimStr(doc.companyName),
    address: trimStr(doc.address),
    phone: trimStr(doc.phone),
    email: trimStr(doc.email),
    formTitle: trimStr(doc.formTitle) || "Contact Form",
    formSubtitle: trimStr(doc.formSubtitle),
  };
}

/**
 * Latest contact section row (Atlas often has one doc; sort avoids arbitrary findOne).
 */
export async function getContactSectionDocument() {
  await connectDB();
  const raw = await ContactSection.findOne().sort({ updatedAt: -1 }).lean();
  return normalizeContactSectionDoc(raw);
}
