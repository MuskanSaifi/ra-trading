"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

export default function Flags() {
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ✅ Optimized: Single API call for all flag products */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Single API call to get all flag products at once (reduces server load)
        const res = await fetch("/api/store/products?limit=24", {
          cache: 'force-cache', // Cache for better performance
          next: { revalidate: 300 } // Revalidate every 5 minutes
        });

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        const allProducts = data?.products || [];

        // Separate products by flags (client-side filtering - faster)
        const trendingProducts = allProducts.filter(p => p.isTrending).slice(0, 8);
        const featuredProducts = allProducts.filter(p => p.isFeatured).slice(0, 8);
        const newArrivalProducts = allProducts.filter(p => p.isNewArrival).slice(0, 8);

        // Use flag-specific products or fallback to general products
        setTrending(trendingProducts.length > 0 ? trendingProducts : allProducts.slice(0, 8));
        setFeatured(featuredProducts.length > 0 ? featuredProducts : allProducts.slice(8, 16));
        setNewArrivals(newArrivalProducts.length > 0 ? newArrivalProducts : allProducts.slice(16, 24));
      } catch (err) {
        console.error("Failed to fetch products for flags:", err);
        // Set empty arrays on error
        setTrending([]);
        setFeatured([]);
        setNewArrivals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderFlagSection = (title, products) => (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="border rounded-lg p-4 animate-pulse bg-white h-72"></div>
            ))
          : products.length > 0
          ? products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={(p) => console.log("Add to cart:", p)}
              />
            ))
          : (
            <p className="col-span-full text-center text-gray-500">
              No products found!
            </p>
          )}
      </div>
    </section>
  );

  return (
    <>
      {renderFlagSection("Trending Products", trending)}
      {renderFlagSection("Featured Products", featured)}
      {renderFlagSection("New Arrivals", newArrivals)}
    </>
  );
}
