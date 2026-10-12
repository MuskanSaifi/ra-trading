"use client";

import PolicyPageClient from "@/components/store/PolicyPageClient";

export default function ShippingReturnsPage() {
  return (
    <PolicyPageClient
      slug="shipping-and-returns"
      fallbackTitle="Shipping Policy"
    />
  );
}
