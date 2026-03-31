"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { sanitizeBlogHtml } from "@/lib/blogHtml";

function SupportContact({ contact }) {
  if (!contact) return null;
  return (
    <div className="mt-12 border-t pt-6 space-y-2 text-sm">
      <h3 className="font-semibold">Support Contact</h3>
      {contact.email && (
        <p className="flex gap-2 items-center">
          <Mail size={16} />
          <a className="hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </p>
      )}
      {contact.phone && (
        <p className="flex gap-2 items-center">
          <Phone size={16} />
          <a className="hover:underline" href={`tel:${contact.phone}`}>
            {contact.phone}
          </a>
        </p>
      )}
      {contact.address && (
        <p className="flex gap-2 items-start">
          <MapPin size={16} className="mt-0.5" />
          {contact.address}
        </p>
      )}
    </div>
  );
}

export default function PolicyPageClient({ slug, fallbackTitle }) {
  const [page, setPage] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [pageRes, contactRes] = await Promise.all([
          fetch(`/api/store/policies/${encodeURIComponent(slug)}`, { cache: "no-store" }),
          fetch("/api/store/contact-section", { cache: "no-store" }),
        ]);

        const pageJson = pageRes.ok ? await pageRes.json() : null;
        const contactJson = contactRes.ok ? await contactRes.json() : null;

        if (!alive) return;
        setPage(pageJson?.success ? pageJson.page : null);
        setContact(contactJson?.success ? contactJson.data : null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const title = page?.title || fallbackTitle || "Policy";
  const safeHtml = useMemo(() => sanitizeBlogHtml(page?.contentHtml || ""), [page?.contentHtml]);

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>

        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : page?.contentHtml ? (
          <div
            className="blog-html max-w-none leading-relaxed text-sm text-gray-700 space-y-6"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p className="text-sm text-gray-600">
            This page hasn’t been set up yet. Please ask an admin to add content.
          </p>
        )}

        <SupportContact contact={contact} />
      </div>
    </section>
  );
}

