import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import ShopListingClient from "@/components/shop/ShopListingClient";

export async function generateMetadata({ params }) {
  await connectDB();
  const { brand_slug } = await params;
  const brand = await Brand.findOne({ slug: brand_slug, status: "active" }).lean();

  if (!brand) {
    return { title: "Brand Not Found | RA Trading" };
  }

  const title = brand.metaTitle || brand.pageTitle || `${brand.name} | RA Trading`;
  const description =
    brand.metaDescription ||
    brand.description ||
    `Explore ${brand.name} products on RA Trading.`;

  return {
    title,
    description,
    keywords: brand.metaKeywords || "",
    alternates: { canonical: `/brand/${brand.slug}` },
    openGraph: {
      title,
      description,
      images: brand.image?.url ? [brand.image.url] : [],
    },
  };
}

export default async function BrandPage({ params }) {
  await connectDB();
  const { brand_slug } = await params;
  const brand = await Brand.findOne({ slug: brand_slug, status: "active" }).lean();

  if (!brand) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-[var(--store-muted)]">
          Loading shop…
        </div>
      }
    >
      <ShopListingClient initialBrandSlug={brand_slug} />
    </Suspense>
  );
}
