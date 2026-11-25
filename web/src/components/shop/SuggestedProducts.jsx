"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

export default function SuggestedProducts({ categorySlug, currentProductId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const res = await fetch(`/api/store/products?category=${categorySlug}&limit=8`);
        const data = await res.json();

        if (data?.products) {
          // current product को हटाया
          const filtered = data.products.filter(
            (p) => p._id !== currentProductId
          );
          setItems(filtered);
        }
      } catch (e) {
        console.log("Related products error:", e);
      }
    }

    fetchRelated();
  }, [categorySlug, currentProductId]);

  if (!items.length) return null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {items.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>
    </div>
  );
}
