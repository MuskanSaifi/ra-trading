"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [moving, setMoving] = useState(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?._id) return setLoading(false);

    try {
      const res = await fetch(`/api/user/wishlist?userId=${user._id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setWishlist(data?.wishlist || []);
    } catch (err) {
      console.log("Wishlist fetch error:", err);
    }

    setLoading(false);
  };

  const syncNavbarCounts = () => {
    window.dispatchEvent(new Event("storage")); // refresh navbar icons
  };

  // ❤️ Remove
  const handleRemove = async (productId) => {
    setRemoving(productId);
    const user = JSON.parse(localStorage.getItem("user"));

    await fetch(`/api/user/wishlist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, productId }),
    });

    setWishlist((prev) => prev.filter((i) => i._id !== productId));
    syncNavbarCounts();

    setTimeout(() => setRemoving(null), 500);
  };

  // 🛒 Move to Cart
  const handleMoveToCart = async (product) => {
    setMoving(product._id);

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cart.find((i) => i._id === product._id);

    const price = product.salePrice ?? product.price;
    const image =
      typeof product.images?.[0] === "string"
        ? product.images[0]
        : product.images?.[0]?.url;
    const minOrder = product.minOrder || 1;
    if (exists) {
      exists.quantity += 1;
      exists.productId = exists.productId || exists._id;
      exists.price = price;
      exists.minOrder = minOrder;
      exists.codAvailable = product.codAvailable !== false;
    } else {
      cart.push({
        _id: product._id,
        productId: product._id,
        name: product.name,
        price,
        image,
        quantity: minOrder,
        minOrder,
        codAvailable: product.codAvailable !== false,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    handleRemove(product._id);

    syncNavbarCounts();

    setTimeout(() => {
      alert("Moved to cart 🛒");
      setMoving(null);
    }, 500);
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <Loader2 className="animate-spin text-gray-500 mx-auto" size={34} />
        <p className="mt-2 text-gray-600">Fetching your wishlist...</p>
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Wishlist ❤️</h1>
        {wishlist?.length > 0 && (
          <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
            {wishlist.length} items
          </span>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center mt-20">
          <Image
            src="/empty-wishlist.png"
            alt="empty"
            width={260}
            height={260}
            className="mx-auto opacity-80"
          />
          <p className="mt-6 text-gray-600 text-lg">Your wishlist is empty.</p>
          <Link
            href="/shop"
            className="inline-block mt-5 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const categorySlug = item?.category?.slug || "category";
            const productSlug = item?.slug || item._id;
            const img = item?.images?.[0]?.url || "/placeholder.png";

            return (
              <div
                key={item._id}
                className={`relative bg-white shadow rounded-xl p-3 hover:shadow-lg transition-all ${
                  removing === item._id ? "opacity-40 scale-95" : ""
                }`}
              >
                {/* ❤️ Remove */}
                <button
                  onClick={() => handleRemove(item._id)}
                  className="absolute top-3 right-3 bg-white shadow p-2 rounded-full hover:scale-110 transition"
                >
                  <Heart className="text-red-500 fill-red-500" size={20} />
                </button>

                <Link href={`/${categorySlug}/${productSlug}`}>
                  <Image
                    src={img}
                    alt={item?.name}
                    width={500}
                    height={400}
                    className="w-full h-56 object-cover rounded-lg hover:scale-105 transition duration-300"
                  />
                </Link>

                <div className="p-3">
                  <Link href={`/${categorySlug}/${productSlug}`}>
                    <h3 className="font-semibold text-gray-800 hover:text-indigo-600 line-clamp-1">
                      {item?.name}
                    </h3>
                  </Link>

                  <p className="text-indigo-700 text-lg font-bold mt-1">
                    ₹{Number(item?.price).toLocaleString()}
                  </p>

                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={moving === item._id}
                    className="w-full mt-3 flex justify-center items-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                  >
                    {moving === item._id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        <span className="ml-2">Move to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
