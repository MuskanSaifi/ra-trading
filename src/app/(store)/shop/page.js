"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import PageBanner from "@/components/store/PageBanner";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [brand, setBrand] = useState(searchParams.get("brand") || "all");
  const [priceRange, setPriceRange] = useState(
    searchParams.get("priceRange") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "default");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const itemsPerPage = 8;

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/store/categories");
      const data = await res.json();
      if (data?.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/store/brands");
      const data = await res.json();
      if (data?.success && Array.isArray(data.brands)) {
        setBrands(data.brands);
      }
    } catch (err) {
      console.error("Brand fetch error:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", itemsPerPage.toString());

      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (brand !== "all") params.set("brand", brand);
      if (priceRange !== "all") params.set("priceRange", priceRange);
      if (sort !== "default") params.set("sort", sort);

      const res = await fetch(`/api/store/products?${params.toString()}`);
      const data = await res.json();

      if (data?.success) {
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.error("Product fetch error:", error);
      setProducts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, brand, priceRange, sort]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (category !== "all") params.set("category", category);
    if (brand !== "all") params.set("brand", brand);
    if (priceRange !== "all") params.set("priceRange", priceRange);
    if (sort !== "default") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());

    router.replace(`/shop?${params.toString()}`, { scroll: false });
  }, [search, category, brand, priceRange, sort, page, router]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setBrand("all");
    setPriceRange("all");
    setSort("default");
    setPage(1);
  };

  const tagFilters = ["Gift", "Bulk", "Premium", "Eco"];

  return (
    <div className="pb-16">
      <PageBanner
        accent="shop"
        title="Shop"
        subtitle="Filter by category and price, then add favourites to your cart."
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />

      <div className="store-container py-10">
        <div className="lg:grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          <aside className="hidden lg:block space-y-6 sticky top-28">
            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[var(--store-ink)] mb-4 text-sm uppercase tracking-wide">
                Categories
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("all");
                      setPage(1);
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${
                      category === "all"
                        ? "bg-[var(--store-primary-soft)] text-[var(--store-primary)] font-bold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    All products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(cat.slug);
                        setPage(1);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-lg ${
                        category === cat.slug
                          ? "bg-[var(--store-primary-soft)] text-[var(--store-primary)] font-bold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[var(--store-ink)] mb-4 text-sm uppercase tracking-wide">
                Price
              </h2>
              <select
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-[var(--store-border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--store-surface)]"
              >
                <option value="all">All prices</option>
                <option value="under5k">Under ₹5,000</option>
                <option value="5kTo20k">₹5,000 – ₹20,000</option>
                <option value="above20k">Above ₹20,000</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[var(--store-ink)] mb-4 text-sm uppercase tracking-wide">
                Brand
              </h2>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-[var(--store-border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--store-surface)]"
              >
                <option value="all">All brands</option>
                {brands.map((b) => (
                  <option key={b._id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--store-border)] bg-[var(--store-ink)] text-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-[var(--store-primary)] mb-2">Tags</p>
              <p className="text-xs text-gray-400 mb-3">Quick ideas — combine with search.</p>
              <div className="flex flex-wrap gap-2">
                {tagFilters.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="rounded-2xl border border-[var(--store-border)] bg-gradient-to-r from-[var(--store-primary)] to-[var(--store-accent)] text-white p-6 mb-6 shadow-md lg:hidden">
              <p className="text-sm font-black uppercase tracking-wider">Sale spotlight</p>
              <p className="text-lg font-bold mt-1">Stack filters below — same tools as desktop.</p>
            </div>

            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 mb-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--store-primary)]/40 bg-[var(--store-surface)]"
                />
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white lg:hidden"
                >
                  <option value="all">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(e.target.value);
                    setPage(1);
                  }}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white lg:hidden"
                >
                  <option value="all">All prices</option>
                  <option value="under5k">Under ₹5,000</option>
                  <option value="5kTo20k">₹5,000 – ₹20,000</option>
                  <option value="above20k">Above ₹20,000</option>
                </select>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setPage(1);
                  }}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white lg:hidden"
                >
                  <option value="all">All brands</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white"
                >
                  <option value="default">Newest first</option>
                  <option value="lowToHigh">Price: Low → High</option>
                  <option value="highToLow">Price: High → Low</option>
                </select>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-[var(--store-muted)]">
                <span>
                  Showing <b className="text-[var(--store-ink)]">{products.length}</b> of{" "}
                  <b className="text-[var(--store-ink)]">{total}</b> products
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-bold text-[var(--store-primary)] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <div key={i} className="h-64 sm:h-72 md:h-80 bg-gray-200 animate-pulse rounded-xl md:rounded-2xl" />
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    category_slug={product?.category?.slug}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-[var(--store-muted)] py-16">
                  No products found
                </p>
              )}
            </div>

            {total > 0 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2.5 rounded-full bg-white border border-[var(--store-border)] font-bold disabled:opacity-50 hover:border-[var(--store-primary)]"
                >
                  Prev
                </button>
                <span className="font-bold text-sm">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-5 py-2.5 rounded-full bg-[var(--store-primary)] text-white font-bold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-[var(--store-muted)]">
          Loading shop…
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
