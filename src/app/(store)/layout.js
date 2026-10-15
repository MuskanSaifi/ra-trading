// app/layout.jsx
import "../globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ViewCartFloatingButton from "@/components/CartButton";
import ChatbotWidget from "@/components/ChatbotWidget";
import { getContactSection } from "@/lib/staticData";

// Metadata from API - no hardcoded company name
export async function generateMetadata() {
  const contact = await getContactSection();

  const siteName = contact?.siteName || "Store";
  const description =
    contact?.description ||
    "RA Trading is a Delhi-based wholesale supplier of shampoo, conditioner, and personal-care products, sold online with pan-India shipping.";
  const faviconUrl = contact?.favicon?.url;

  return {
    title: {
      default: `${siteName} | Legal name RA Trading | Wholesale shampoo and conditioner supplier`,
      template: `%s | ${siteName}`,
    },
    description,
    icons: faviconUrl
      ? {
          icon: [
            {
              url: faviconUrl,
              type: "image/png",
            },
          ],
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : undefined,
    openGraph: {
      title: siteName,
      description,
      type: "website",
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden max-w-full">
        <header className="sticky top-0 z-50 w-full max-w-full min-w-0 overflow-x-clip">
          <Navbar />
        </header>
        <main className="main-container min-h-[50vh] bg-[var(--store-surface)]">
          <p className="bg-[#6f1d1b] px-4 py-2 text-center text-xs leading-5 text-white sm:text-sm">
            Legal name: RA Trading. Nature of business: wholesale supplier of shampoo, conditioner, and personal-care products, sold online and shipped across India.
          </p>
          {children}
          <ViewCartFloatingButton />
          <ChatbotWidget />
        </main>
        <footer className="w-full max-w-full min-w-0 overflow-x-clip">
          <Footer />
        </footer>
      </body>
    </html>
  );
}
