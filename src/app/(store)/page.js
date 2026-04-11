import ContactSection from "@/components/ContactSection";
import Sections from "@/components/Sections";
import Category from "./all-categories/page";
import HomePromoBanners from "@/components/store/HomePromoBanners";
import HomeProductTabs from "@/components/store/HomeProductTabs";
import HomeLatestBlogs from "@/components/store/HomeLatestBlogs";
import HomeBrands from "@/components/store/HomeBrands";
import AboutSection from "@/components/AboutSection";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import { getContactSection } from "@/lib/staticData";

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

// SEO from API - company name & description from contact section
export async function generateMetadata() {
  const contact = await getContactSection();
  const siteName = contact.siteName;
  const description = contact.description || `Shop at ${siteName}. Quality products, secure payments, and fast delivery.`;

  return {
    title: `${siteName} - Quality Products at Best Prices`,
    description,
    openGraph: {
      title: `${siteName} - Quality Products at Best Prices`,
      description,
      type: "website",
    },
  };
}

export default function Home() {
  return (
    <div>
      <Sections section="landingpage-frontsection"/>
      <Category/>
      <HomeBrands />
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