"use client";

import PolicyPageClient from "@/components/store/PolicyPageClient";

export default function TermsConditionsPage() {
  return (
    <PolicyPageClient
      slug="terms-and-conditions"
      fallbackTitle="Terms & Conditions"
    />
  );
}