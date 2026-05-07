"use client";

import React, { useEffect, useState } from "react";
import ContactForm from "./ContactForm";
import {
  Clock3,
  ShieldCheck,
  Zap,
  BriefcaseBusiness,
  Package,
  PhoneCall,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Star,
  Headphones,
} from "lucide-react";

const featureIconMap = {
  zap: Zap,
  briefcase: BriefcaseBusiness,
  package: Package,
  shield: ShieldCheck,
  clock: Clock3,
  mail: Mail,
  phone: PhoneCall,
  star: Star,
  support: Headphones,
};

const contactTypeIconMap = {
  phone: PhoneCall,
  email: Mail,
  address: MapPin,
};

const socialIconMap = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
};

const ContactSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContactData = async () => {
    try {
      const res = await fetch("/api/store/contact-section", { cache: "no-store" });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      let json = {};
      try {
        json = await res.json();
      } catch {
        console.error("Empty or invalid JSON response");
        return;
      }

      if (json.success && json.data) {
        setData(json.data);
      } else {
        console.error(json.message || "No data found");
      }
    } catch (err) {
      console.error("GET ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Loading...</p>;
  }

  if (!data) {
    return (
      <p className="text-center py-10 text-red-500">
        Contact info not found.
      </p>
    );
  }

  const featureItems =
    (data.featureHighlights || []).length > 0
      ? data.featureHighlights
      : [
          { title: "Quick Response", description: "We reply within 24 hours", iconName: "zap" },
          { title: "Expert Support", description: "Get help from our experts", iconName: "briefcase" },
          { title: "Bulk & Private Label", description: "Solutions tailored for you", iconName: "package" },
          { title: "Reliable & Trusted", description: "Quality you can count on", iconName: "shield" },
        ];

  const contactItems =
    (data.contactItems || []).length > 0
      ? data.contactItems
      : [
          { type: "phone", value: data.phone, note: "Mon - Sat (10:00 AM - 7:00 PM)" },
          { type: "email", value: data.email, note: "We'll reply as soon as possible" },
          { type: "address", value: data.address, note: "Shipping all over India" },
        ].filter((item) => item.value);

  return (
    <section className="bg-[#f7f3f3] py-14 text-[#3f2a2a] md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid gap-8 pb-0 lg:grid-cols-2 lg:gap-10 lg:pb-24">
        <div className="rounded-[28px] border border-[#e5d9d9] bg-[#fbf8f8] p-7 md:p-10">
          <p className="inline-block rounded-md bg-[#efe5e5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f1d1b]">
            {data.badgeText?.trim() || "Get In Touch"}
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#2f1c1c] sm:text-4xl">
            {data.title?.trim() || "We’re Here to Help Your Business Grow"}
          </h2>
          <div className="mt-4 h-[2px] w-14 rounded-full bg-[#6f1d1b]" />

          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#6d5a5a]">
            {data.subtitle?.trim() ||
              data.description?.trim() ||
              "Have questions, need a quote, or want to start your own brand? Our team is ready to assist you."}
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {featureItems.map((feature, idx) => {
              const Icon = featureIconMap[feature?.iconName] || Zap;
              return (
                <div
                  key={`${feature?.title || "feature"}-${idx}`}
                  className="flex items-start gap-3 rounded-xl border border-[#eadede] bg-white p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4ebeb] text-[#6f1d1b]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3f2a2a]">
                      {feature?.title || "Feature"}
                    </p>
                    {feature?.description ? (
                      <p className="mt-1 text-sm text-[#776363]">{feature.description}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-4 border-t border-[#e5d9d9] pt-6">
            {contactItems.map((item, idx) => {
              const Icon = contactTypeIconMap[item?.type] || PhoneCall;
              return (
                <div key={`${item?.type || "item"}-${idx}`} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#f4ebeb] p-2 text-[#6f1d1b]">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="font-medium text-[#3f2a2a]">{item?.value}</p>
                    {item?.note ? (
                      <p className="text-sm text-[#776363]">{item.note}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2">
            {(data.socialLinks || []).map((social, idx) => {
              const platform = (social?.platform || "").toLowerCase();
              const Icon = social?.icon?.url ? null : socialIconMap[platform] || MessageCircle;
              return (
                <a
                  key={`${platform || "social"}-${idx}`}
                  href={social?.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e2d1d1] bg-white text-[#6f1d1b]"
                  aria-label={social?.platform || "social link"}
                >
                  {social?.icon?.url ? (
                    <img
                      src={social.icon.url}
                      alt={social?.platform || "social"}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <Icon size={15} />
                  )}
                </a>
              );
            })}
          </div>

        </div>

        <ContactForm sectionData={data} />

        {data.showcaseImage?.url ? (
          <div className="pointer-events-none hidden lg:block lg:absolute lg:-bottom-6 lg:left-[14%] lg:z-10">
            <img
              src={data.showcaseImage.url}
              alt="Contact showcase"
              className="w-[460px] object-contain drop-shadow-[0_14px_26px_rgba(35,18,18,0.18)]"
            />
          </div>
        ) : null}
        </div>

        {data.showcaseImage?.url ? (
          <div className="mt-6 flex justify-center lg:hidden">
            <img
              src={data.showcaseImage.url}
              alt="Contact showcase"
              className="w-full max-w-[320px] object-contain"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ContactSection;
