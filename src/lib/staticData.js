/**
 * Helper functions for static generation and ISR
 * These functions fetch data directly from DB (not via API) for better performance
 */

import { connectDB } from "./dbConnect";
import Category from "@/models/Category";
import Product from "@/models/Product";

/**
 * Get all active categories for static generation
 */
export async function getAllCategories() {
  try {
    await connectDB();
    const categories = await Category.find({ status: "active" })
      .select("name slug image description")
      .sort({ createdAt: -1 })
      .lean();
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get all active products for static generation
 */
export async function getAllProducts() {
  try {
    await connectDB();
    const products = await Product.find({ status: "active" })
      .select("name slug category brand")
      .populate("category", "slug")
      .lean();
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Get products by category slug
 */
export async function getProductsByCategory(categorySlug) {
  try {
    await connectDB();
    
    const category = await Category.findOne({ slug: categorySlug, status: "active" }).lean();
    if (!category) {
      return { category: null, products: [] };
    }

    const products = await Product.find({ 
      category: category._id,
      status: "active"
    })
      .select("name slug price salePrice discount images stock isTrending isFeatured isNewArrival category brand createdAt")
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return { category, products };
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return { category: null, products: [] };
  }
}

/**
 * Get single product by category and product slug
 */
export async function getProductBySlugs(categorySlug, productSlug) {
  try {
    await connectDB();
    
    const category = await Category.findOne({ slug: categorySlug, status: "active" }).lean();
    if (!category) {
      return { success: false, product: null };
    }

    const product = await Product.findOne({
      slug: productSlug,
      category: category._id,
      status: "active"
    })
      .populate("brand")
      .populate("category")
      .lean();

    if (!product) {
      return { success: false, product: null };
    }

    return { success: true, product };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, product: null };
  }
}

/**
 * Get featured/trending products for homepage
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    await connectDB();
    const products = await Product.find({ 
      status: "active",
      $or: [
        { isFeatured: true },
        { isTrending: true },
        { isNewArrival: true }
      ]
    })
      .select("name slug price salePrice discount images stock isTrending isFeatured isNewArrival category brand createdAt")
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}
