import ContactSection from "@/components/ContactSection";
import Sections from "@/components/Sections";
import ProductsList from "@/components/ProductsList";
import Category from "./all-categories/page";
import Flags from "@/components/shop/Flags";
import AboutSection from "@/components/AboutSection";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export const metadata = {
  title: "Shree Rama Trading - Quality Products at Best Prices",
  description: "Shop the latest products at Shree Rama Trading. Quality products, secure payments, and fast delivery.",
  openGraph: {
    title: "Shree Rama Trading - Quality Products at Best Prices",
    description: "Shop the latest products at Shree Rama Trading",
    type: "website",
  },
};

export default function Home() {
  return (
    <div>
      <Sections section="landingpage-frontsection"/>
      <Category/>
      <ProductsList limit={8} title="Featured Products" />
      <Flags/>
      <AboutSection/>
      <Reviews/>
      <FAQ/>
      <ContactSection/>
    </div>
  );
}