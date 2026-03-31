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
    <section className="bg-[var(--store-surface)] py-8 md:py-16 px-3 sm:px-6">
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
        <div className="hidden md:flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat?._id || cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="snap-start shrink-0"
            >
              <div className="w-72 md:w-80 bg-white rounded-3xl p-8 border border-[var(--store-border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--store-primary)]/40 cursor-pointer">
                <div className="flex justify-center">
                  {cat?.image?.url ? (
                    <img
                      src={cat.image.url}
                      alt={cat.name}
                      className="w-36 h-36 object-cover rounded-full border-2 border-[var(--store-primary-soft)] bg-gray-100"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-[var(--store-primary-soft)] flex items-center justify-center text-4xl font-black text-[var(--store-primary)]">
                      {cat?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="mt-6 text-center text-xl font-black text-[var(--store-ink)]">
                  {cat.name}
                </h2>

                <p className="mt-2 text-center text-sm font-bold text-[var(--store-primary)]">
                  Explore products →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
