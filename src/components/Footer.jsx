"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch("/api/store/contact-section", {
          cache: "no-store",
        });

        if (!res.ok) {
          // Use default data if API fails
          setContact({
            title: "E-Commerce Store",
            description: "Your trusted shopping destination",
            address: "",
            phone: "",
            email: "",
            logo: { url: "" },
            socialLinks: []
          });
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setContact(json.data);
        } else {
          // Fallback to default data
          setContact({
            title: "E-Commerce Store",
            description: "Your trusted shopping destination",
            address: "",
            phone: "",
            email: "",
            logo: { url: "" },
            socialLinks: []
          });
        }
      } catch (err) {
        console.error("Footer fetch error:", err.message);
        // Set default data on error so footer still renders
        setContact({
          title: "E-Commerce Store",
          description: "Your trusted shopping destination",
          address: "",
          phone: "",
          email: "",
          logo: { url: "" },
          socialLinks: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, []);
  
  if (loading) {
    return (
      <footer className="bg-gray-900 text-center py-10 text-gray-400">
        Loading footer...
      </footer>
    );
  }

  if (!contact) {
    return (
      <footer className="bg-gray-900 text-center py-10 text-red-400">
        Footer data not found
      </footer>
    );
  }

  return (
    <footer className="bg-[var(--store-ink)] text-gray-300 pt-14 border-t-4 border-[var(--store-primary)]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

        {/* ✅ Branding */}
        <div>
          {contact.logo?.url && (
            <img
              src={contact.logo.url}
              alt="Logo"
              className="h-14 mb-4 object-contain"
            />
          )}

          <h2 className="text-2xl font-bold text-white mb-3">
            {contact.title?.trim() || contact.companyName?.trim() || "Store"}
          </h2>

          <p className="text-sm leading-relaxed text-gray-400">
            {contact.description}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-white transition">Home</a></li>
            <li><a href="/shop" className="hover:text-[var(--store-primary)] transition">Shop</a></li>
            <li><a href="/blog" className="hover:text-[var(--store-primary)] transition">Blog</a></li>
            <li><a href="/about" className="hover:text-[var(--store-primary)] transition">About Us</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/faq" className="hover:text-white transition">FAQ</a></li>
            <li><a href="/shipping-and-returns" className="hover:text-white transition">Shipping & Returns</a></li>
            <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
            <li><a href="/terms-and-conditions" className="hover:text-white transition">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* ✅ Contact + Dynamic Social Links */}
<div>
  <h3 className="text-lg font-semibold text-white mb-4">Get in Touch</h3>

  <div className="space-y-3 text-sm">

    {/* Address - Click to open Google Maps */}
    {contact.address && (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 hover:text-white transition"
      >
        <MapPin size={16} /> {contact.address}
      </a>
    )}

    {/* Phone - Click to Call */}
    {contact.phone && (
      <a
        href={`tel:${contact.phone}`}
        className="flex items-center gap-2 hover:text-white transition"
      >
        <Phone size={16} /> {contact.phone}
      </a>
    )}

    {/* Email - Click to Email */}
    {contact.email && (
      <a
        href={`mailto:${contact.email}`}
        className="flex items-center gap-2 hover:text-white transition"
      >
        <Mail size={16} /> {contact.email}
      </a>
    )}

  </div>

  {/* ✅ SOCIAL LINKS FROM ADMIN PANEL */}
  <div className="flex gap-4 mt-6 flex-wrap">
    {contact.socialLinks?.map((social, index) => (
      <a
        key={index}
        href={social.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition"
        title={social.platform}
      >
        {social.icon?.url ? (
          <img
            src={social.icon.url}
            alt={social.platform}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <span className="text-sm">{social.platform}</span>
        )}
      </a>
    ))}
  </div>
</div>

      </div>

      {/* Bottom bar */}
      <div className="mt-12 border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()}{" "}
        {contact.title?.trim() || contact.companyName?.trim() || "Store"}. All
        Rights Reserved.
      </div>
    </footer>
  );
}
