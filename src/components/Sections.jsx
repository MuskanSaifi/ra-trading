"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Sections = ({ section }) => {
  const [data, setData] = useState(null);
  const router = useRouter();

  const fetchBanner = async () => {
    try {
      const res = await fetch("/api/store/sections");
      const json = await res.json();
      const selected = json?.banners?.find((item) => item.section === section);
      setData(selected);
    } catch (error) {
      console.log("Banner API Error:", error);
    }
  };

  useEffect(() => {
    if (section) fetchBanner();
  }, [section]);

  const title = data?.title || "Deals you can trust — shop smarter";
  const subtitle =
    data?.subtitle ||
    "Quality products, secure checkout, and quick dispatch. Browse categories or jump straight into the catalog.";
  const imgUrl = data?.bannerUrl?.url;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--store-surface)] via-white to-[var(--store-primary-soft)]">
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_70%_30%,var(--store-primary),transparent_45%)]" />
      <div className="store-container relative py-14 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--store-primary)] mb-3">
            Welcome
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--store-ink)] leading-tight mb-5">
            {title}
          </h1>
          <p className="text-[var(--store-muted)] text-base md:text-lg mb-8 max-w-xl">{subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="bg-[var(--store-primary)] text-[var(--store-ink)] px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[var(--store-primary-dark)] transition-colors"
            >
              {data?.buttonText1 || "Shop now"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/about")}
              className="border-2 border-[var(--store-ink)] text-[var(--store-ink)] px-8 py-3.5 rounded-full font-bold hover:bg-[var(--store-ink)] hover:text-white transition-colors"
            >
              {data?.buttonText2 || "Learn more"}
            </button>
          </div>
        </div>

        <div className="relative">
          {imgUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-[var(--store-border)] rotate-1 hover:rotate-0 transition-transform duration-500">
              <img src={imgUrl} alt="" className="w-full max-h-[520px] object-cover" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--store-primary)]/30 to-[var(--store-primary-soft)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] text-sm font-semibold"
                >
                  Image {i}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Sections;
