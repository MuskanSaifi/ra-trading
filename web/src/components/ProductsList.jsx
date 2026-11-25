"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";

export default function ProductsList({ limit = 8, title = "All Products" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/store/products?limit=${limit}`, {
          cache: 'force-cache', // Enable caching to reduce server load
          next: { revalidate: 300 }, // Revalidate every 5 minutes
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!res.ok) {
          console.error("API response not OK:", res.status, res.statusText);
          setProducts([]);
          return;
        }

        const data = await res.json();

        if (data?.success && Array.isArray(data.products)) {
          setProducts(data.products);
          if (data.products.length === 0) {
            console.log("No products found in database");
          }
        } else {
          console.error("API returned unsuccessful response:", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-64 sm:h-72 md:h-80 bg-gray-200 animate-pulse rounded-lg md:rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h2>
        <p className="text-center text-gray-500">No products found</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            category_slug={product?.category?.slug}
          />
        ))}
      </div>
    </section>
  );
}

