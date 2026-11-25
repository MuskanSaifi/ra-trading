"use client";

import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ShoppingCart, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import Link from "next/link";
import PageBanner from "@/components/store/PageBanner";
import Image from "next/image";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    // Normalize legacy carts: enforce MOQ and sane quantities
    const normalized = Array.isArray(stored)
      ? stored.map((i) => {
          const minOrder = Number(i.minOrder || 1);
          const qty = Number(i.quantity || 0);
          return {
            ...i,
            quantity: Math.max(minOrder, qty || minOrder),
          };
        })
      : [];
    setCartItems(normalized);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
      const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: totalQty }));
    }
  }, [cartItems, initialized]);

  const handleQuantityChange = (id, type) => {
    const current = cartItems.find((x) => x._id === id);
    const minOrder = Number(current?.minOrder || 1);
    if (type === "dec" && current && Number(current.quantity) <= minOrder) {
      alert(`Minimum order quantity (MOQ) for this product is ${minOrder}.`);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                type === "inc"
                  ? item.quantity + 1
                  : Math.max(Number(item.minOrder || 1), item.quantity - 1),
            }
          : item
      )
    );
  };

  const handleRemove = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  // Matches the flat shipping charge applied at checkout
  const shipping = subtotal > 0 ? 99 : 0;
  const total = subtotal + shipping;
  const itemCount = cartItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const formatInr = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="pb-28 lg:pb-10">
      <PageBanner
        accent="cart"
        title="Shopping cart"
        subtitle="Review items before checkout."
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]}
      />

      <div className="store-container py-10">
        {!initialized ? (
          <p className="text-center text-[var(--store-muted)]">Loading…</p>
        ) : cartItems.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-16 rounded-2xl border border-dashed border-[var(--store-border)] bg-white">
            <ShoppingCart className="mx-auto text-[var(--store-primary)] mb-4" size={48} />
            <p className="text-[var(--store-muted)] text-lg mb-6">Your cart is empty</p>
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="bg-[var(--store-primary)] text-white font-bold px-8 py-3 rounded-full hover:bg-[var(--store-primary-dark)]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[var(--store-border)] shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden border border-[var(--store-border)]"
                      style={{ backgroundColor: item.imageBgColor || "#ffffff" }}
                    >
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name || "Cart item"}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                        sizes="96px"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-[var(--store-ink)] line-clamp-2">{item.name}</h2>
                      <p className="text-[var(--store-primary)] font-black text-lg mt-1">
                        ₹{Number(item.price).toLocaleString()}
                      </p>
                      {(Number(item.minOrder || 1) > 1) && (
                        <p className="text-xs text-amber-800 mt-1">
                          MOQ: {Number(item.minOrder || 1)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 border border-[var(--store-border)] rounded-full px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item._id, "dec")}
                        className="w-8 h-8 font-bold text-lg"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item._id, "inc")}
                        className="w-8 h-8 font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item._id)}
                      className="text-red-500 hover:text-red-600 p-2"
                      aria-label="Remove"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-[var(--store-border)] bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-lg font-bold text-[var(--store-ink)]">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <dt>Items ({itemCount})</dt>
                  <dd className="font-semibold">{formatInr(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-semibold">{formatInr(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--store-border)] pt-3 text-base">
                  <dt className="font-bold text-[var(--store-ink)]">Total</dt>
                  <dd className="font-black text-[var(--store-primary)]">{formatInr(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[var(--store-primary-dark)]"
              >
                Proceed to checkout
                <ArrowRight size={18} />
              </button>
              <Link
                href="/shop"
                className="mt-3 block text-center text-sm font-medium text-[var(--store-primary)] hover:underline"
              >
                Continue shopping
              </Link>

              <div className="mt-6 space-y-2 border-t border-[var(--store-border)] pt-4 text-xs text-gray-600">
                <p className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-700" />
                  Secure payment with PayU or cash on delivery
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={16} className="text-[var(--store-primary)]" />
                  Shipping across India
                </p>
              </div>
            </aside>

            {/* Mobile: keep the total and checkout button in reach while scrolling */}
            <div className="fixed inset-x-0 bottom-0 z-[80] flex items-center justify-between gap-4 border-t border-[var(--store-border)] bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
              <div>
                <p className="text-xs text-gray-500">Total ({itemCount} items)</p>
                <p className="text-lg font-black text-[var(--store-ink)]">{formatInr(total)}</p>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="flex items-center gap-2 rounded-xl bg-[var(--store-primary)] px-6 py-3 font-bold text-white"
              >
                Checkout
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
