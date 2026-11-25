import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/dbConnect";
import Category from "@/models/Category";
import ShopListingClient from "@/components/shop/ShopListingClient";

export async function generateMetadata({ params }) {
  await connectDB();
  const { category_slug } = await params;
  const category = await Category.findOne({
    slug: category_slug,
    status: "active",
  }).lean();

  if (!category) {
    return { title: "Category Not Found | RA Trading" };
  }

  const title =
    category.metaTitle || category.pageTitle || `${category.name} | RA Trading`;
  const description =
    category.metaDescription ||
    category.description ||
    `Explore ${category.name} products on RA Trading.`;

  return {
    title,
    description,
    keywords: category.metaKeywords || "",
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title,
      description,
      images: category.image?.url ? [category.image.url] : [],
    },
  };
}

export default async function CategoryPage({ params }) {
  await connectDB();
  const { category_slug } = await params;
  const category = await Category.findOne({
    slug: category_slug,
    status: "active",
  }).lean();

  if (!category) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-[var(--store-muted)]">
          Loading shop…
        </div>
      }
    >
      <ShopListingClient initialCategorySlug={category_slug} />
    </Suspense>
  );
}
