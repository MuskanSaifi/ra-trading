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
  const description = contact?.description || "";
  const faviconUrl = contact?.favicon?.url;

  return {
    title: {
      default: siteName,
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
      <body>
        <header className="sticky top-0 z-50 w-full">
          <Navbar />
        </header>
        <main className="main-container min-h-[50vh] bg-[var(--store-surface)]">
          {children}
          <ViewCartFloatingButton />
          <ChatbotWidget />
        </main>
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
