"use client";

import { useEffect, useState, useCallback } from "react";
import ProductCard from "@/components/shop/ProductCard";

const tabs = [
  { id: "all", label: "All products", params: "" },
  { id: "new", label: "New arrivals", params: "isNewArrival=true" },
  { id: "featured", label: "Featured", params: "isFeatured=true" },
  { id: "top", label: "Top selling", params: "isTrending=true" },
];

export default function HomeProductTabs() {
  const [active, setActive] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTab = useCallback(async (tabId) => {
    setLoading(true);
    const tab = tabs.find((t) => t.id === tabId) || tabs[0];
    const q = tab.params ? `&${tab.params}` : "";
    try {
      const res = await fetch(`/api/store/products?limit=8${q}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setProducts(data.success && Array.isArray(data.products) ? data.products : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(active);
  }, [active, fetchTab]);

  return (
    <section className="bg-white py-12 md:py-16 border-t border-[var(--store-border)]">
      <div className="store-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--store-ink)]">
              Our products
            </h2>
            <p className="text-[var(--store-muted)] mt-1 text-sm md:text-base">
              Browse by what matters to you — same catalog, smart filters.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active === t.id
                    ? "bg-[var(--store-primary)] text-white shadow-md"
                    : "bg-[var(--store-surface)] text-[var(--store-ink)] border border-[var(--store-border)] hover:border-[var(--store-primary)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 sm:h-72 md:h-80 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-[var(--store-muted)] py-12">No products in this tab yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full font-bold text-white bg-[var(--store-ink)] hover:bg-neutral-800 transition-colors"
          >
            View all in shop
          </a>
        </div>
      </div>
    </section>
  );
}
