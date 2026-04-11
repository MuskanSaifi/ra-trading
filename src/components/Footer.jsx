"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  ArrowRight,
  Instagram,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Truck,
    title: "Fast Dispatch",
    desc: "Made for smooth restocking flows",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Protected checkout experience",
  },
  {
    icon: Headphones,
    title: "Support Team",
    desc: "Helpful assistance when you need it",
  },
];

const SHOP_LINKS = [
  { label: "Best Sellers", href: "/shop" },
  { label: "New Arrivals", href: "/shop" },
  { label: "Brands", href: "/all-categories" },
  { label: "Deals", href: "/shop" },
];

const COMPANY_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Post Your Requirement", href: "/contact" },
];

function findInstagramLink(socialLinks) {
  if (!socialLinks?.length) return null;
  return socialLinks.find(
    (s) =>
      /instagram/i.test(s.platform || "") ||
      /instagram\.com/i.test(s.url || "")
  );
}

export default function Footer() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch("/api/store/contact-section", {
          cache: "no-store",
        });

        const fallback = {
          title: "E-Commerce Store",
          subtitle: "",
          companyName: "E-Commerce Store",
          description: "Your trusted shopping destination",
          address: "",
          phone: "",
          email: "",
          logo: { url: "" },
          socialLinks: [],
        };

        if (!res.ok) {
          setContact(fallback);
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setContact(json.data);
        } else {
          setContact(fallback);
        }
      } catch (err) {
        console.error("Footer fetch error:", err.message);
        setContact({
          title: "E-Commerce Store",
          subtitle: "",
          companyName: "E-Commerce Store",
          description: "Your trusted shopping destination",
          address: "",
          phone: "",
          email: "",
          logo: { url: "" },
          socialLinks: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, []);

  const brandTitle =
    contact?.title?.trim() || contact?.companyName?.trim() || "Store";
  const brandSubtitle = contact?.subtitle?.trim() || "Marketplace";
  const instagramLink = useMemo(
    () => findInstagramLink(contact?.socialLinks),
    [contact?.socialLinks]
  );

  const handleNewsletter = (e) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return;
    }
    if (contact?.email) {
      window.open(
        `mailto:${contact.email}?subject=${encodeURIComponent("Newsletter signup")}&body=${encodeURIComponent(`Please add this email to the newsletter list:\n${trimmed}`)}`,
        "_blank"
      );
    }
    setNewsletterDone(true);
    setNewsletterEmail("");
  };

  if (loading) {
    return (
      <footer className="store-footer-premium border-t border-white/10">
        <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 py-16 animate-pulse">
          <div className="h-24 rounded-2xl bg-white/5 mb-10" />
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-48 rounded-2xl bg-white/5" />
            <div className="lg:col-span-5 h-48 rounded-2xl bg-white/5" />
            <div className="lg:col-span-3 h-48 rounded-2xl bg-white/5" />
          </div>
        </div>
      </footer>
    );
  }

  if (!contact) {
    return (
      <footer className="store-footer-premium border-t border-white/10 py-12 text-center text-red-400 relative z-[1]">
        Footer data not found
      </footer>
    );
  }

  return (
    <footer className="store-footer-premium w-full max-w-full min-w-0 border-t border-white/10">
      {/* Ambient glows — kept inside footer bounds to avoid horizontal page scroll */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute w-[min(100%,420px)] aspect-square rounded-full opacity-[0.22] -left-[35%] top-[2%] blur-[80px] bg-violet-500 sm:-left-[25%]" />
        <div className="absolute w-[min(100%,380px)] aspect-square rounded-full opacity-[0.16] left-[15%] top-[20%] blur-[72px] bg-[var(--store-primary)]" />
        <div className="absolute w-[min(100%,440px)] aspect-square rounded-full opacity-[0.2] -right-[30%] bottom-[4%] blur-[80px] bg-blue-600 sm:-right-[20%]" />
      </div>

      <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        {/* Top benefit row */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-14 md:mb-16">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="store-glass-footer-top-card flex gap-4 items-start p-5 md:p-6"
            >
              <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[var(--store-primary)] ring-1 ring-white/15">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-bold text-white tracking-wide uppercase">
                  {title}
                </p>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main columns */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-start gap-3">
              {contact.logo?.url ? (
                <img
                  src={contact.logo.url}
                  alt=""
                  className="h-14 w-14 rounded-xl object-contain bg-white/5 p-1 ring-1 ring-white/10"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[var(--store-primary)] to-violet-600 ring-1 ring-white/20" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
                  {brandTitle}
                </h2>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                  {brandSubtitle}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              {contact.description}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 backdrop-blur-sm">
              <Sparkles
                className="h-3.5 w-3.5 text-[var(--store-primary)] shrink-0"
                strokeWidth={2}
              />
              <span>Crafted for dependable wholesale &amp; retail</span>
            </div>

            {(contact.address || contact.phone || contact.email) && (
              <div className="pt-2 space-y-2.5 text-sm text-gray-400">
                {contact.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-white transition-colors"
                  >
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
                    {contact.address}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-gray-500" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-gray-500" />
                    {contact.email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* SHOP + COMPANY */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8 sm:gap-10">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                Shop
              </h3>
              <ul className="space-y-3 text-sm">
                {SHOP_LINKS.map(({ label, href }) => (
                  <li key={href + label}>
                    <a
                      href={href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                Company
              </h3>
              <ul className="space-y-3 text-sm">
                {COMPANY_LINKS.map(({ label, href }) => (
                  <li key={href + label}>
                    <a
                      href={href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <div className="store-glass-newsletter p-6 md:p-7 h-full flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                Get launches, offers, and curated updates delivered to your
                inbox.
              </p>
              <form onSubmit={handleNewsletter} className="space-y-3 mt-auto">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    setNewsletterDone(false);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--store-primary)]/50 focus:ring-1 focus:ring-[var(--store-primary)]/30"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] hover:bg-[var(--store-primary-dark)] text-white font-semibold py-3 px-4 text-sm transition-colors"
                >
                  Subscribe
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
              {newsletterDone && (
                <p className="text-xs text-green-400 mt-3">
                  Thanks! Check your email client if a draft opened.
                </p>
              )}
              {instagramLink && (
                <a
                  href={instagramLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {instagramLink.icon?.url ? (
                    <img
                      src={instagramLink.icon.url}
                      alt="Instagram"
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <Instagram className="h-5 w-5 text-pink-400" />
                  )}
                  Follow us on Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Other social (non-Instagram) */}
        {contact.socialLinks?.filter(
          (s) => !/instagram/i.test(s.platform || "")
        ).length > 0 && (
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-center lg:justify-start">
            {contact.socialLinks
              .filter((s) => !/instagram/i.test(s.platform || ""))
              .map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-90 transition-opacity"
                  title={social.platform}
                >
                  {social.icon?.url ? (
                    <img
                      src={social.icon.url}
                      alt={social.platform}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-sm text-gray-400 hover:text-white">
                      {social.platform}
                    </span>
                  )}
                </a>
              ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          Copyright {new Date().getFullYear()}{" "}
          {brandTitle}. Crafted for modern commerce.
        </div>
      </div>
    </footer>
  );
}
