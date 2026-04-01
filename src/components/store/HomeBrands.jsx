"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/store/brands", { cache: "no-store" });
        const data = await res.json();
        if (data?.success) setBrands(data.brands || []);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, []);

  if (loading || brands.length === 0) return null;

  return (
    <section className="bg-white py-8 md:py-12 px-3 sm:px-6">
      <div className="store-container mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[var(--store-ink)]">
          Shop by brand
        </h2>
        <p className="mt-2 text-[var(--store-muted)] text-sm md:text-base">
          Select a brand to view all its products.
        </p>
      </div>

      <div className="store-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {brands.map((brand) => (
          <Link
            key={brand._id}
            href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
            className="group flex flex-col items-center rounded-2xl border border-[var(--store-border)] bg-[var(--store-surface)] p-3 md:p-4 hover:border-[var(--store-primary)]/40 hover:shadow-md transition"
          >
            {brand?.image?.url ? (
              <img
                src={brand.image.url}
                alt={brand.name}
                className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover border border-[var(--store-primary-soft)] bg-white"
              />
            ) : (
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-[var(--store-primary-soft)] text-[var(--store-primary)] flex items-center justify-center text-xl font-black">
                {brand?.name?.[0]?.toUpperCase() || "B"}
              </div>
            )}
            <span className="mt-2 text-center text-xs md:text-sm font-semibold text-[var(--store-ink)] line-clamp-2">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

