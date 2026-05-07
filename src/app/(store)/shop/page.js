"use client";

import React, { Suspense } from "react";
import ShopListingClient from "@/components/shop/ShopListingClient";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-[var(--store-muted)]">
          Loading shop…
        </div>
      }
    >
      <ShopListingClient />
    </Suspense>
  );
}
