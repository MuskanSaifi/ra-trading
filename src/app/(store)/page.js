import ContactSection from "@/components/ContactSection";
import Sections from "@/components/Sections";
import Category from "./all-categories/page";
import HomePromoBanners from "@/components/store/HomePromoBanners";
import HomeProductTabs from "@/components/store/HomeProductTabs";
import HomeLatestBlogs from "@/components/store/HomeLatestBlogs";
import HomeBrands from "@/components/store/HomeBrands";
import HomeGraphics from "@/components/store/HomeGraphics";
import HomeReels from "@/components/store/HomeReels";
import AboutSection from "@/components/AboutSection";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import { getContactSection } from "@/lib/staticData";
import BusinessSummary from "@/components/store/BusinessSummary";

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

// SEO from API - company name & description from contact section
export async function generateMetadata() {
  const contact = await getContactSection();
  const siteName = contact.siteName;
  const description =
    contact.description ||
    `${siteName} is a Delhi-based wholesale supplier of shampoo, conditioner, and personal-care products. Buy online with secure payments and pan-India shipping.`;

  return {
    title: `${siteName} | Legal name RA Trading | Wholesale shampoo and conditioner`,
    description,
    openGraph: {
      title: `${siteName} | Legal name RA Trading | Wholesale shampoo and conditioner`,
      description,
      type: "website",
    },
  };
}

export default function Home() {
  return (
    <div>
      <BusinessSummary />
      <Sections section="landingpage-frontsection"/>
      <HomeGraphics />
      <Category/>
      <HomeBrands />
      <HomeReels />
      <HomePromoBanners />
      <HomeProductTabs />
      <HomeLatestBlogs />
      <AboutSection/>
      <Reviews/>
      <FAQ/>
      <ContactSection/>
    </div>
  );
}