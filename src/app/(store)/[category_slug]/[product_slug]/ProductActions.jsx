"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Heart,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Truck,
  Minus,
  Plus,
  Zap,
} from "lucide-react";

export default function ProductActions({ product }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wish, setWish] = useState(false);
  const [busy, setBusy] = useState(false);

  const minOrder = product.minOrder || 1;
  const [qty, setQty] = useState(minOrder);

  const price = product.salePrice || product.price;
  const mrp = product.price;
  const discount = product.discount || 0;
  const stock = product.stock || 0;
  const image = product.images?.[0]?.url;

  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 5;

  // ⭐ total price (LIVE)
const totalPrice = Number((price * qty).toFixed(2));
const totalMrp = Number((mrp * qty).toFixed(2));
const totalSaving = Number(((mrp - price) * qty).toFixed(2));

  /* ---------------- Wishlist State ---------------- */
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("wishlistIds")) || [];
      setWish(ids.includes(product._id));
    } catch {
      setWish(false);
    }
  }, [product._id]);

  const syncWishlistIds = (fn) => {
    const old = JSON.parse(localStorage.getItem("wishlistIds")) || [];
    localStorage.setItem("wishlistIds", JSON.stringify(fn(old)));
  };

  const toggleWish = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?._id) {
      window.location.href = `/auth/login?redirect=/${product.category.slug}/${product.slug}`;
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      const method = wish ? "DELETE" : "POST";
      await fetch("/api/user/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          productId: product._id,
        }),
      });

      setWish(!wish);
      syncWishlistIds((ids) =>
        wish ? ids.filter((id) => id !== product._id) : [...ids, product._id]
      );
    } catch (e) {
      console.log("Wishlist error:", e);
    }

    setBusy(false);
  };

  /* ---------------- Add to Cart ---------------- */
  const addToCart = () => {
    if (adding || outOfStock) return;
    setAdding(true);

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const exists = cart.find((i) => i._id === product._id);

    if (exists) {
      exists.quantity += qty;
      exists.productId = exists.productId || exists._id;
      exists.minOrder = product.minOrder || 1;
      exists.codAvailable = product.codAvailable !== false;
    }
    else {
      cart.push({
        _id: product._id,
        productId: product._id,
        name: product.name,
        price,
        image,
        quantity: qty,
        minOrder: product.minOrder || 1,
        codAvailable: product.codAvailable !== false,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // 🔔 update header cart count
    const totalQty = cart.reduce((a, i) => a + i.quantity, 0);
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: totalQty }));

    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 900);
  };

  /* ---------------- Buy Now ---------------- */
  const buyNow = () => {
    addToCart();
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 800);
  };

  return (
    <div className="space-y-5 border rounded-xl p-5 bg-white shadow-sm">

      {/* 💰 PRICE */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[var(--store-primary)]">
            ₹{totalPrice}
          </span>

          {discount > 0 && (
            <span className="line-through text-gray-400">
              ₹{totalMrp}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600">
          ₹{price} × {qty} item{qty > 1 ? "s" : ""}
        </p>

        {discount > 0 && totalSaving > 0 && (
          <p className="text-green-600 text-sm font-semibold">
            You save ₹{totalSaving}
          </p>
        )}
      </div>

      {/* 📦 STOCK */}
      {outOfStock ? (
        <p className="text-red-600 font-semibold">Out of Stock</p>
      ) : lowStock ? (
        <p className="text-orange-600 font-semibold">
          Only {stock} left – hurry!
        </p>
      ) : (
        <p className="text-green-600">In Stock</p>
      )}

      {/* 🔢 QUANTITY */}
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="font-medium">Quantity</span>
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() =>
                setQty((q) => Math.max(minOrder, q - 1))
              }
              className="px-3 py-1"
            >
              <Minus size={16} />
            </button>
            <span className="px-4 font-semibold">{qty}</span>
            <button
              onClick={() =>
                setQty((q) => Math.min(stock, q + 1))
              }
              className="px-3 py-1"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ❤️ WISHLIST */}
      <button
        onClick={toggleWish}
        disabled={busy}
        className="flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-100"
      >
        <Heart
          size={20}
          className={wish ? "text-red-500 fill-red-500" : "text-gray-700"}
        />
        {wish ? "Wishlisted" : "Add to Wishlist"}
      </button>

      {/* 🛒 ADD TO CART */}
      <button
        onClick={addToCart}
        disabled={adding || added || outOfStock}
        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2
          ${
            outOfStock
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : added
              ? "bg-green-600 text-white"
              : "bg-[var(--store-primary)] text-[var(--store-ink)] font-bold hover:bg-[var(--store-primary-dark)]"
          }`}
      >
        {adding ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Adding...
          </>
        ) : added ? (
          <>
            <CheckCircle2 size={20} /> Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart size={20} /> Add to Cart
          </>
        )}
      </button>

      {/* ⚡ BUY NOW */}
      {!outOfStock && (
        <button
          onClick={buyNow}
          className="w-full py-3 rounded-lg flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
        >
          <Zap size={20} /> Buy Now
        </button>
      )}

      {/* 🔐 TRUST INFO */}
      <div className="pt-3 space-y-2 text-sm text-gray-600 border-t">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} /> Secure Payments
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw size={16} /> Easy Returns
        </div>
        <div className="flex items-center gap-2">
          <Truck size={16} /> Fast Delivery
        </div>
      </div>
    </div>
  );
}
