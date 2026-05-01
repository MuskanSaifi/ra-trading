"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/store/categories");
        const data = await res.json();
        if (data?.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-24 text-gray-500 text-lg">
        Loading categories...
      </p>
    );
  }

  return (
    <section className="bg-[var(--store-surface)] py-8 md:py-16 px-3 sm:px-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="store-container mb-6 md:mb-10 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-[var(--store-ink)]">
          Shop by category
        </h1>
        <p className="mt-2 md:mt-3 text-[var(--store-muted)] text-sm md:text-lg max-w-xl mx-auto">
          Jump into a category — filters on the shop page refine further.
        </p>
      </div>

      <div className="store-container relative">
        {/* Mobile: 4 compact tiles per row (scroll if more categories) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:hidden">
          {categories.map((cat) => (
            <Link
              key={cat?._id || cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center rounded-xl border border-[var(--store-border)] bg-white p-2 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-center w-full">
                {cat?.image?.url ? (
                  <img
                    src={cat.image.url}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border border-[var(--store-primary-soft)] bg-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--store-primary-soft)] flex items-center justify-center text-sm sm:text-lg font-black text-[var(--store-primary)]">
                    {cat?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="mt-1.5 text-center text-[9px] sm:text-[10px] font-bold text-[var(--store-ink)] uppercase leading-tight line-clamp-2 min-h-[1.75rem]">
                {cat.name}
              </h2>
              <span className="mt-0.5 text-[8px] sm:text-[9px] font-bold text-[var(--store-primary)]">
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Tablet+: horizontal scroll, larger cards */}
     {/* Desktop: fixed grid (5–6 cards per row) */}
<div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
  {categories.map((cat) => (
    <Link
      key={cat?._id || cat.slug}
      href={`/shop?category=${cat.slug}`}
      className="w-full"
    >
      <div className="bg-white rounded-2xl p-5 border border-[var(--store-border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--store-primary)]/40 cursor-pointer h-full flex flex-col items-center justify-between">
        
        <div className="flex justify-center">
          {cat?.image?.url ? (
            <img
              src={cat.image.url}
              alt={cat.name}
              className="w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-full border-2 border-[var(--store-primary-soft)] bg-gray-100"
            />
          ) : (
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-[var(--store-primary-soft)] flex items-center justify-center text-2xl font-black text-[var(--store-primary)]">
              {cat?.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="mt-4 text-center text-sm lg:text-base font-black text-[var(--store-ink)] line-clamp-2 min-h-[2.5rem]">
          {cat.name}
        </h2>

        <p className="mt-2 text-xs font-bold text-[var(--store-primary)]">
          Explore →
        </p>
      </div>
    </Link>
  ))}
</div>
      </div>
    </section>
  );
}
