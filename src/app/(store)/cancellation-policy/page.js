"use client";

import PolicyPageClient from "@/components/store/PolicyPageClient";

export default function CancellationPolicyPage() {
  return (
    <PolicyPageClient
      slug="cancellation-policy"
      fallbackTitle="Cancellation Policy"
    />
  );
}
