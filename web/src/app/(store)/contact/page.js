import ContactSection from "@/components/ContactSection";
import PageBanner from "@/components/store/PageBanner";

export default function ContactPage() {
  return (
    <div>
      <PageBanner
        accent="contact"
        title="Contact"
        subtitle="Reach the team — we respond as soon as we can."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <ContactSection />
    </div>
  );
}
