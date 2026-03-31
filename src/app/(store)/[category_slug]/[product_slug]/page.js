import React from "react";
import Link from "next/link";
import ProductActions from "./ProductActions";
import SuggestedProducts from "@/components/shop/SuggestedProducts";
import PageBanner from "@/components/store/PageBanner";
import { getProductBySlugs, getAllProducts, getAllCategories, getContactSection } from "@/lib/staticData";
import { notFound } from "next/navigation";

// ISR: Revalidate every 60 seconds (1 minute)
export const revalidate = 60;

// Generate static params for all products at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();
  const products = await getAllProducts();
  
  // Create params for each product with its category
  const params = [];
  
  for (const product of products) {
    const category = categories.find(cat => 
      cat._id.toString() === product.category?._id?.toString() || 
      cat._id.toString() === product.category?.toString()
    );
    
    if (category && product.slug) {
      params.push({
        category_slug: category.slug,
        product_slug: product.slug,
      });
    }
  }
  
  return params;
}

// Generate metadata for SEO - site name from API
export async function generateMetadata({ params }) {
  const { category_slug, product_slug } = await params;
  const contact = await getContactSection();
  const siteName = contact.siteName;
  const { product } = await getProductBySlugs(category_slug, product_slug);
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const price = product.salePrice || product.price;
  const imageUrl = product.images?.[0]?.url;

  return {
    title: `${product.name} - ${siteName}`,
    description: product.description || `Buy ${product.name} at ₹${price}. Quality products at ${siteName}.`,
    openGraph: {
      title: `${product.name} - ${siteName}`,
      description: product.description || `Buy ${product.name} at ₹${price}`,
      images: imageUrl ? [imageUrl] : [],
      // Next.js 16 strict OpenGraph types: use "website"
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `Buy ${product.name} at ₹${price}`,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { category_slug, product_slug } = await params;
  const { product } = await getProductBySlugs(category_slug, product_slug);

  // If product not found, show 404
  if (!product) {
    notFound();
  }

  const price = product.salePrice || product.price;

  return (
    <div className="pb-16">
      <PageBanner
        accent="default"
        title={product.name}
        subtitle={product.category?.name ? `Category: ${product.category.name}` : ""}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          {
            label: product.category?.name || "Category",
            href: product.category?.slug ? `/shop?category=${product.category.slug}` : "/shop",
          },
          { label: product.name },
        ]}
      />

      <div className="store-container py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="rounded-2xl overflow-hidden border border-[var(--store-border)] bg-white shadow-lg">
            <img
              src={product.images?.[0]?.url}
              alt={product.name}
              className="w-full object-cover max-h-[520px]"
            />
          </div>

          <div className="space-y-5 lg:pt-4">
            <p className="text-sm font-bold text-[var(--store-primary)] uppercase tracking-wide">
              {product.brand?.name || "Featured product"}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--store-ink)] leading-tight">
              {product.name}
            </h1>
            <p className="text-[var(--store-muted)] leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-black text-[var(--store-primary)]">₹{price}</span>
              {product.discount > 0 && (
                <span className="text-lg line-through text-gray-400">₹{product.price}</span>
              )}
            </div>

            <div className="pt-2">
              <ProductActions product={product} />
            </div>

            <Link
              href="/shop"
              className="inline-flex mt-4 text-sm font-bold text-[var(--store-ink)] border-b-2 border-[var(--store-primary)] hover:text-[var(--store-primary)]"
            >
              ← Back to shop
            </Link>
          </div>
        </div>

        <SuggestedProducts
          categorySlug={product.category?.slug}
          currentProductId={product._id}
        />
      </div>
    </div>
  );
}
