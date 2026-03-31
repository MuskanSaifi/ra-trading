"use client";

import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import PageBanner from "@/components/store/PageBanner";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(stored);
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
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity:
                type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1),
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

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="pb-28">
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
              className="bg-[var(--store-primary)] text-[var(--store-ink)] font-bold px-8 py-3 rounded-full hover:bg-[var(--store-primary-dark)]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-w-3xl">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[var(--store-border)] shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt=""
                      className="w-24 h-24 rounded-xl object-cover border border-[var(--store-border)]"
                    />
                    <div>
                      <h2 className="font-bold text-[var(--store-ink)] line-clamp-2">{item.name}</h2>
                      <p className="text-[var(--store-primary)] font-black text-lg mt-1">
                        ₹{Number(item.price).toLocaleString()}
                      </p>
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

            <div className="fixed bottom-0 left-0 right-0 bg-[var(--store-ink)] text-white shadow-2xl p-5 flex flex-wrap justify-between items-center gap-4 z-40 border-t-4 border-[var(--store-primary)]">
              <div className="text-lg font-bold">
                Subtotal:{" "}
                <span className="text-[var(--store-primary)]">₹{subtotal.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="bg-[var(--store-primary)] text-[var(--store-ink)] px-8 py-3 rounded-full font-black hover:bg-[var(--store-primary-dark)]"
              >
                Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
