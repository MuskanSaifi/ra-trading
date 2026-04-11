"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Flame,
  Sparkles,
} from "lucide-react";

export default function ProductCard({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const categorySlug = product?.category?.slug || "category";
  const productSlug = product?.slug || "product";

  const image = product?.images?.[0]?.url || "/placeholder.png";
  const price = product?.salePrice || product?.price;
  const mrp = product?.price;
  const discount = product?.discount || 0;

  const stock = product?.stock || 0;
  const lowStock = stock > 0 && stock <= 5;

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("wishlistIds")) || [];
      setIsWishlisted(ids.includes(product._id));
    } catch {
      setIsWishlisted(false);
    }
  }, [product._id]);

  const syncWishlistIds = (fn) => {
    const current = JSON.parse(localStorage.getItem("wishlistIds")) || [];
    localStorage.setItem("wishlistIds", JSON.stringify(fn(current)));
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const localUser = JSON.parse(localStorage.getItem("user"));
    if (!localUser?._id) {
      window.location.href = `/auth/login?redirect=/${categorySlug}/${productSlug}`;
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      const method = isWishlisted ? "DELETE" : "POST";
      await fetch("/api/user/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localUser._id,
          productId: product._id,
        }),
      });

      setIsWishlisted(!isWishlisted);
      syncWishlistIds((ids) =>
        isWishlisted ? ids.filter((id) => id !== product._id) : [...ids, product._id]
      );
    } catch (err) {
      console.log("Wishlist error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || stock === 0) return;
    setAdding(true);

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const exists = cart.find((i) => i._id === product._id);

    const minOrder = product.minOrder || 1;
    if (exists) {
      exists.quantity += 1;
      exists.productId = exists.productId || exists._id;
      exists.minOrder = product.minOrder || 1;
      exists.codAvailable = product.codAvailable !== false;
    } else {
      cart.push({
        _id: product._id,
        productId: product._id,
        name: product.name,
        price,
        image,
        quantity: minOrder,
        minOrder,
        codAvailable: product.codAvailable !== false,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: cart.reduce((a, i) => a + i.quantity, 0),
      })
    );

    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 1000);
  };

  return (
    <div className="group rounded-lg md:rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition relative border border-[var(--store-border)]/60 md:border-0">
      <button
        type="button"
        onClick={handleWishlistToggle}
        disabled={busy}
        className="absolute top-1.5 right-1.5 md:top-3 md:right-3 bg-white/95 p-1.5 md:p-2 rounded-full shadow z-20"
        aria-label="Wishlist"
      >
        <Heart
          className={`h-4 w-4 md:h-[18px] md:w-[18px] ${isWishlisted ? "text-red-500 fill-red-500" : "text-gray-500"}`}
          strokeWidth={2}
        />
      </button>

      <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 flex flex-col gap-0.5 z-20 max-w-[45%]">
        {discount > 0 && (
          <span className="bg-red-500 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded leading-none">
            {discount}% OFF
          </span>
        )}
        {product?.isTrending && (
          <span className="bg-orange-500 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none">
            <Flame size={10} className="md:w-3 md:h-3" />
            <span className="hidden sm:inline">Trending</span>
          </span>
        )}
        {product?.isNewArrival && (
          <span className="bg-green-600 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none">
            <Sparkles size={10} className="md:w-3 md:h-3" />
            <span className="hidden sm:inline">New</span>
          </span>
        )}
      </div>

      <div className="relative">
        <Link href={`/${categorySlug}/${productSlug}`}>
          <img
            src={image}
            alt={product?.name}
            className="w-full h-36 sm:h-44 md:h-56 object-cover group-hover:scale-105 transition"
          />
        </Link>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || added || stock === 0}
          className={`md:hidden absolute bottom-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
            stock === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : added
                ? "bg-green-600 text-white"
                : "bg-[var(--store-primary)] text-[var(--store-ink)]"
          }`}
          aria-label={stock === 0 ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
        >
          {adding ? (
            <Loader2 size={20} className="animate-spin" />
          ) : added ? (
            <CheckCircle2 size={20} />
          ) : (
            <ShoppingCart size={20} strokeWidth={2.25} />
          )}
        </button>
      </div>

      <div className="p-2 sm:p-3 md:p-4 space-y-1 md:space-y-2">
        <div className="hidden sm:flex justify-between text-xs text-gray-500">
          <span>{product?.brand?.name}</span>
          <span>{product?.gender}</span>
        </div>

        <Link href={`/${categorySlug}/${productSlug}`}>
          <h3 className="font-semibold text-gray-800 group-hover:text-[var(--store-primary)] line-clamp-2 text-xs sm:text-sm md:text-base min-h-[2.5rem] sm:min-h-0">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm sm:text-base md:text-lg font-bold text-[var(--store-primary)]">
            ₹{price}
          </span>
          {discount > 0 && (
            <span className="text-xs md:text-sm line-through text-gray-400">₹{mrp}</span>
          )}
        </div>

        {product?.attributes?.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-1 text-xs">
            {product.attributes.slice(0, 3).map((attr, i) => (
              <span key={i} className="border px-2 py-0.5 rounded text-gray-600">
                {attr.value}
              </span>
            ))}
          </div>
        )}

        {stock === 0 ? (
          <p className="text-red-500 text-xs md:text-sm font-semibold">Out of Stock</p>
        ) : lowStock ? (
          <p className="text-orange-500 text-[10px] md:text-sm font-semibold">Only {stock} left</p>
        ) : (
          <p className="text-green-600 text-[10px] md:text-sm hidden sm:block">In Stock</p>
        )}

        {added && (
          <div className="hidden md:flex items-center gap-2 text-green-600 text-sm font-semibold">
            <CheckCircle2 size={16} /> Added to Cart
          </div>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || added || stock === 0}
          className={`hidden md:flex w-full py-2 rounded-lg items-center justify-center gap-2 transition 
            ${
              stock === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : added
                  ? "bg-green-600 text-white"
                  : "bg-[var(--store-primary)] text-[var(--store-ink)] font-bold hover:bg-[var(--store-primary-dark)]"
            }`}
        >
          {adding ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Adding...
            </>
          ) : added ? (
            <>
              <CheckCircle2 size={18} /> Added
            </>
          ) : (
            <>
              <ShoppingCart size={18} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
