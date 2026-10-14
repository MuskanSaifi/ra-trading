import Link from "next/link";
import { getContactSection } from "@/lib/staticData";

const FALLBACK =
  "RA Trading is a Delhi-based wholesale supplier of shampoo, conditioner, and personal-care products. Customers and businesses can buy these products on this website and we ship across India.";

export default async function BusinessSummary() {
  const contact = await getContactSection();
  const name = contact.companyName || contact.siteName || "RA Trading";
  const description =
    contact.description &&
    !/trusted shopping destination|quality products/i.test(contact.description)
      ? contact.description
      : FALLBACK;

  return (
    <section className="border-b border-[#eadede] bg-[#fbf8f8]">
      <div className="mx-auto max-w-5xl px-6 py-8 text-[#2f1c1c]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f1d1b]">
          Legal name and nature of business
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">
          Legal name: RA Trading
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5c4a4a] sm:text-base">
          Nature of business: {name} is a Delhi-based wholesale supplier of
          shampoo, conditioner, and personal-care products. These products are
          sold on this website. Customers pay online or by cash on delivery, and
          orders are shipped across India.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5c4a4a] sm:text-base">
          {description}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/about" className="font-medium text-[#6f1d1b] underline">
            About us
          </Link>
          <Link href="/shop" className="font-medium text-[#6f1d1b] underline">
            Shop products
          </Link>
          <Link href="/contact" className="font-medium text-[#6f1d1b] underline">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
