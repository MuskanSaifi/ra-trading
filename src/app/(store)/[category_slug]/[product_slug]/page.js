import React from "react";
import ProductActions from "./ProductActions";
import SuggestedProducts from "@/components/shop/SuggestedProducts";
import { getProductBySlugs, getAllProducts, getAllCategories } from "@/lib/staticData";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { category_slug, product_slug } = await params;
  const { product } = await getProductBySlugs(category_slug, product_slug);
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const price = product.salePrice || product.price;
  const imageUrl = product.images?.[0]?.url;

  return {
    title: `${product.name} - Shree Rama Trading`,
    description: product.description || `Buy ${product.name} at ₹${price}. ${product.description || 'Quality products at best prices.'}`,
    openGraph: {
      title: `${product.name} - Shree Rama Trading`,
      description: product.description || `Buy ${product.name} at ₹${price}`,
      images: imageUrl ? [imageUrl] : [],
      type: "product",
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
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        <img
          src={product.images?.[0]?.url}
          alt={product.name}
          className="w-full rounded-xl shadow-md border"
        />

        <div className="space-y-4">
          <h1 className="text-4xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>

          <p className="text-3xl font-bold text-indigo-700">₹{price}</p>

          {/* ⭐ Add to Wishlist + Add to Cart */}
          <ProductActions product={product} />
        </div>
      </div>

      {/* ⭐ Suggested Section */}
      <SuggestedProducts
        categorySlug={product.category?.slug}
        currentProductId={product._id}
      />
    </div>
  );
}
