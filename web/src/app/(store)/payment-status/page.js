"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentStatus() {
  const params = useSearchParams();
  const success = params.get("result") === "success";
  const orderId = params.get("order");

  useEffect(() => {
    if (!success) return;
    localStorage.removeItem("cart");
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: 0 }));
  }, [success]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className={`text-2xl font-bold ${success ? "text-green-700" : "text-red-700"}`}>
          {success ? "Payment successful" : "Payment failed"}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {success
            ? "Your order has been placed. You can track it from your orders page."
            : "The payment was not completed, so the order was not confirmed. Your cart is still saved. You can try again."}
        </p>
        {orderId && (
          <p className="mt-2 text-xs text-gray-500">Order #{orderId}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          {success ? (
            <Link
              href="/user-dashboard/orders"
              className="rounded-lg bg-[#6f1d1b] px-4 py-2 text-sm font-semibold text-white"
            >
              View my orders
            </Link>
          ) : (
            <Link
              href="/checkout"
              className="rounded-lg bg-[#6f1d1b] px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </Link>
          )}
          <Link href="/" className="rounded-lg border px-4 py-2 text-sm font-semibold">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatus />
    </Suspense>
  );
}
