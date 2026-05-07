"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import PageBanner from "@/components/store/PageBanner";

export default function ShopListingClient({
  initialBrandSlug = "all",
  initialCategorySlug = "all",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(initialCategorySlug);
  const [brand, setBrand] = useState(initialBrandSlug);
  const [priceRange, setPriceRange] = useState(
    searchParams.get("priceRange") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "default");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const fetchLimit = 100;
  const selectedBrand =
    brand !== "all" ? brands.find((b) => b.slug === brand) : null;
  const selectedCategory =
    category !== "all" ? categories.find((c) => c.slug === category) : null;
  const activeCollection = selectedBrand || selectedCategory;
  const pageTitle = activeCollection?.pageTitle || activeCollection?.name || "Shop";
  const pageSubtitle =
    activeCollection?.description ||
    "Filter by category and price, then add favourites to your cart.";

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
      params.set("limit", fetchLimit.toString());
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (brand !== "all") params.set("brand", brand);
      if (priceRange !== "all") params.set("priceRange", priceRange);
      if (sort !== "default") params.set("sort", sort);

      const res = await fetch(`/api/store/products?${params.toString()}`);
      const data = await res.json();

      if (data?.success) {
        setProducts(data.products || []);
        setTotal(data.total || (data.products?.length ?? 0));
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Product fetch error:", error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, category, brand, priceRange, sort]);

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
    if (priceRange !== "all") params.set("priceRange", priceRange);
    if (sort !== "default") params.set("sort", sort);
    if (category !== "all" && brand !== "all") {
      params.set("category", category);
      params.set("brand", brand);
    }

    const basePath =
      brand !== "all" && category === "all"
        ? `/shop/brand/${brand}`
        : category !== "all" && brand === "all"
        ? `/shop/category/${category}`
        : "/shop";

    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }, [search, category, brand, priceRange, sort, router]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setBrand("all");
    setPriceRange("all");
    setSort("default");
  };

  const tagFilters = ["Gift", "Bulk", "Premium", "Eco"];

  return (
    <div className="pb-16">
      <PageBanner
        accent="shop"
        title={pageTitle}
        subtitle={pageSubtitle}
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />

      <div className="store-container py-10">
        <div className="lg:grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          <aside className="hidden lg:block space-y-6 sticky top-24 self-start">
            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[var(--store-ink)] mb-4 text-sm uppercase tracking-wide">
                Categories
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => setCategory("all")}
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
                      onClick={() => setCategory(cat.slug)}
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
                onChange={(e) => setPriceRange(e.target.value)}
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
                onChange={(e) => setBrand(e.target.value)}
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
              <p className="text-lg font-bold mt-1">Use filter button to refine products quickly.</p>
            </div>

            <div className="rounded-2xl border border-[var(--store-border)] bg-white p-5 mb-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--store-primary)]/40 bg-[var(--store-surface)]"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white"
                >
                  <option value="default">Newest first</option>
                  <option value="lowToHigh">Price: Low → High</option>
                  <option value="highToLow">Price: High → Low</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
                  className="lg:hidden border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm font-bold bg-white hover:bg-gray-50"
                >
                  {isMobileFiltersOpen ? "Close Filters" : "Filter"}
                </button>
              </div>

              {isMobileFiltersOpen && (
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 border border-[var(--store-border)] rounded-xl p-3 bg-[var(--store-surface)]">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white"
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
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white"
                  >
                    <option value="all">All prices</option>
                    <option value="under5k">Under ₹5,000</option>
                    <option value="5kTo20k">₹5,000 – ₹20,000</option>
                    <option value="above20k">Above ₹20,000</option>
                  </select>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="border border-[var(--store-border)] rounded-xl px-4 py-3 text-sm bg-white sm:col-span-2"
                  >
                    <option value="all">All brands</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 sm:h-72 md:h-80 bg-gray-200 animate-pulse rounded-xl md:rounded-2xl"
                  />
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

            {activeCollection?.contentHtml && (
              <section className="mt-10 rounded-2xl border border-[var(--store-border)] bg-white p-5 md:p-8 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-[var(--store-ink)] mb-4">
                  {activeCollection.pageTitle || activeCollection.name}
                </h2>
                <div
                  className="prose prose-sm md:prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: activeCollection.contentHtml }}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
