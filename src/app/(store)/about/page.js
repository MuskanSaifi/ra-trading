import AboutSection from "@/components/AboutSection";
import PageBanner from "@/components/store/PageBanner";

export default function AboutPage() {
  return (
    <div>
      <PageBanner
        accent="about"
        title="About us"
        subtitle="Our story, values, and how we serve you."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />
      <AboutSection />
    </div>
  );
}
