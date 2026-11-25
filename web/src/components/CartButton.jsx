"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function summarize(cart) {
  return {
    count: cart.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    subtotal: cart.reduce(
      (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
      0
    ),
  };
}

export default function ViewCartFloatingButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [summary, setSummary] = useState({ count: 0, subtotal: 0 });
  const [justAdded, setJustAdded] = useState(false);
  const lastCount = useRef(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    const refresh = () => {
      const next = summarize(readCart());
      if (next.count > lastCount.current) {
        setJustAdded(true);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setJustAdded(false), 2500);
      }
      lastCount.current = next.count;
      setSummary(next);
    };

    const initial = summarize(readCart());
    lastCount.current = initial.count;
    setSummary(initial);

    window.addEventListener("cartUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cartUpdated", refresh);
      window.removeEventListener("storage", refresh);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  const hidden =
    summary.count === 0 ||
    pathname === "/cart" ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/payment-status") ||
    pathname?.startsWith("/user-dashboard") ||
    pathname?.startsWith("/admin-dashboard") ||
    pathname?.startsWith("/category/");
  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-3 right-20 z-[60] sm:left-1/2 sm:right-auto sm:w-[min(36rem,calc(100vw-8rem))] sm:-translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white p-2.5 pl-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition ${
          justAdded ? "border-green-500 ring-2 ring-green-500/30" : "border-[var(--store-border)]"
        }`}
      >
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--store-primary)]/10 text-[var(--store-primary)]">
            {justAdded ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <ShoppingCart size={20} />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-gray-500">
              {justAdded ? "Added to cart" : `${summary.count} item${summary.count > 1 ? "s" : ""} in cart`}
            </span>
            <span className="block text-base font-black text-[var(--store-ink)]">
              ₹{summary.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="hidden rounded-xl border border-[var(--store-border)] px-4 py-2.5 text-sm font-semibold text-[var(--store-ink)] hover:bg-gray-50 sm:block"
        >
          View cart
        </button>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--store-primary)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--store-primary-dark)]"
        >
          Checkout
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
