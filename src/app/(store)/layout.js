// app/layout.jsx
import "../globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ViewCartFloatingButton from "@/components/CartButton";
import { getContactSection } from "@/lib/staticData";

// Metadata from API - no hardcoded company name
export async function generateMetadata() {
  const contact = await getContactSection();
  const siteName = contact.siteName;
  const description = contact.description;
  const faviconUrl = contact.favicon?.url;

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
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
        <header>
          <Navbar />
        </header>
        <main className="main-container bg-white">
          {children}
          <ViewCartFloatingButton />
        </main>
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
