/**
 * Helper function to trigger on-demand ISR revalidation
 * Call this after creating/updating/deleting products or categories
 */

export async function revalidateProductPages(product, category) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const secret = process.env.REVALIDATE_SECRET || "your-secret-key";

    const paths = [
      "/", // Homepage
      "/shop", // Shop page
    ];

    // Add category page if category exists
    if (category?.slug) {
      paths.push(`/${category.slug}`);
    }

    // Add product page if product exists
    if (product?.slug && category?.slug) {
      paths.push(`/${category.slug}/${product.slug}`);
    }

    // Revalidate all paths
    for (const path of paths) {
      try {
        await fetch(`${baseUrl}/api/revalidate?path=${path}&secret=${secret}`, {
          method: "POST",
        });
      } catch (err) {
        console.error(`Failed to revalidate ${path}:`, err.message);
      }
    }

    console.log("✅ Revalidated pages:", paths);
  } catch (error) {
    console.error("❌ Revalidation error:", error);
    // Don't throw - revalidation failure shouldn't break the main operation
  }
}

export async function revalidateCategoryPages(category) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const secret = process.env.REVALIDATE_SECRET || "your-secret-key";

    const paths = [
      "/", // Homepage
      "/shop", // Shop page
    ];

    // Add category page if category exists
    if (category?.slug) {
      paths.push(`/${category.slug}`);
    }

    // Revalidate all paths
    for (const path of paths) {
      try {
        await fetch(`${baseUrl}/api/revalidate?path=${path}&secret=${secret}`, {
          method: "POST",
        });
      } catch (err) {
        console.error(`Failed to revalidate ${path}:`, err.message);
      }
    }

    console.log("✅ Revalidated category pages:", paths);
  } catch (error) {
    console.error("❌ Revalidation error:", error);
  }
}
