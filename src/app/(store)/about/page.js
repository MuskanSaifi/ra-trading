import AboutSection from "@/components/AboutSection";
import PageBanner from "@/components/store/PageBanner";
import AboutPageExtraSections from "@/components/store/AboutPageExtraSections";

export default function AboutPage() {
  return (
    <div>
      <PageBanner
        accent="about"
        title="About RA Trading"
        subtitle="Delhi-based wholesale supplier of shampoo, conditioner, and personal-care products."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />
      <AboutSection />
      <AboutPageExtraSections />
    </div>
  );
}
