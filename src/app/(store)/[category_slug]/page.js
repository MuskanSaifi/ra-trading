import ProductCard from "@/components/shop/ProductCard";
import { getProductsByCategory, getAllCategories } from "@/lib/staticData";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// ISR: Revalidate every 60 seconds (1 minute)
export const revalidate = 60;

// Generate static params for all categories at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();
  
  return categories.map((category) => ({
    category_slug: category.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { category_slug } = await params;
  const { category } = await getProductsByCategory(category_slug);
  
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - Shree Rama Trading`,
    description: category.description || `Browse ${category.name} products at Shree Rama Trading`,
    openGraph: {
      title: `${category.name} - Shree Rama Trading`,
      description: category.description || `Browse ${category.name} products`,
      images: category.image?.url ? [category.image.url] : [],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { category_slug } = await params;
  const { category, products } = await getProductsByCategory(category_slug);

  // If category not found, show 404
  if (!category) {
    notFound();
  }

  return (
    <section className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold capitalize">
        {category.name}
      </h1>
      
      {category.description && (
        <p className="text-gray-600 mt-2">{category.description}</p>
      )}

      {products.length === 0 ? (
        <p className="mt-10 text-gray-500">No products found in this category.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              category_slug={product?.category?.slug}
            />
          ))}
        </div>
      )}
    </section>
  );
}
