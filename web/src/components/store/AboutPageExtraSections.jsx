"use client";

import { useEffect, useState } from "react";

function SectionShell({ title, children }) {
  return (
    <section className="py-14 bg-white">
      <div className="store-container max-w-5xl">
        {title ? (
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--store-ink)] mb-6">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function RichHtml({ html }) {
  if (!html || html === "<p></p>") return null;
  return (
    <div
      className="prose prose-slate max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_img]:h-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function AboutPageExtraSections() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/store/about", { cache: "no-store" });
        const data = await res.json();
        setAbout(data?.about || null);
      } catch {
        setAbout(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (!about) return null;

  const hasCompany = (about.companyContentHtml || "").trim() && about.companyContentHtml !== "<p></p>";
  const hasDirector =
    ((about.directorContentHtml || "").trim() && about.directorContentHtml !== "<p></p>") ||
    (about.directorImage?.url || "").trim() ||
    (about.directorName || "").trim();
  const hasTrust = (about.trustContentHtml || "").trim() && about.trustContentHtml !== "<p></p>";

  return (
    <>
      {hasCompany && (
        <SectionShell title={about.companyTitle || "About Company"}>
          <RichHtml html={about.companyContentHtml} />
        </SectionShell>
      )}

      {hasDirector && (
        <section className="py-14 bg-gradient-to-b from-gray-50 to-white">
          <div className="store-container max-w-5xl grid gap-8 md:grid-cols-12 items-start">
            <div className="md:col-span-5">
              {about.directorImage?.url ? (
                <img
                  src={about.directorImage.url}
                  alt={about.directorName || "Director"}
                  className="w-full max-w-md rounded-2xl border border-[var(--store-border)] shadow-md object-cover"
                />
              ) : null}
            </div>
            <div className="md:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--store-primary)]">
                {about.directorTitle || "Director"}
              </p>
              {about.directorName ? (
                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--store-ink)] mt-2">
                  {about.directorName}
                </h2>
              ) : null}
              <div className="mt-5">
                <RichHtml html={about.directorContentHtml} />
              </div>
            </div>
          </div>
        </section>
      )}

      {hasTrust && (
        <SectionShell title={about.trustTitle || "Trust"}>
          <RichHtml html={about.trustContentHtml} />
        </SectionShell>
      )}
    </>
  );
}

