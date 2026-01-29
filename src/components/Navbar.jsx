"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaHeart,
  FaShoppingCart,
  FaUser,
  FaBars,
  FaTimes,
  FaSearch
} from "react-icons/fa";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";

export default function Navbar() {
  const router = useRouter();

  const [headerInfo, setHeaderInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // SEARCH
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // REAL COUNTS
  const [cartCount, setCartCount] = useState(0);          // total quantity
  const [wishCount, setWishCount] = useState(0);          // wishlist length

  const containerRef = useRef(null);

  // 📌 LOAD TOP INFO (with caching to reduce server load)
  useEffect(() => {
    fetch("/api/store/contact-section", {
      cache: 'force-cache',
      next: { revalidate: 600 } // Revalidate every 10 minutes
    })
      .then(r => r.json())
      .then(d => setHeaderInfo(d?.data || null))
      .catch(() => {});
  }, []);

  // 📌 LOAD COUNTS + SYNC
  useEffect(() => {
    const syncCounts = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const wish = JSON.parse(localStorage.getItem("wishlistIds") || "[]");

      // total quantity count
      const totalQty = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

      setCartCount(totalQty);
      setWishCount(wish.length);

      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };

    syncCounts();
    window.addEventListener("storage", syncCounts);

    return () => window.removeEventListener("storage", syncCounts);
  }, []);

  // 📌 LIVE SEARCH
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/store/products?search=${encodeURIComponent(query)}&limit=6`, {
          cache: 'no-store', // Search should be fresh
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (res.ok) {
          const d = await res.json();
          setSuggestions(d.products || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  const selectProduct = (p) => {
    router.push(`/${p.category?.slug}/${p.slug}`);
    setQuery("");
    setShowSuggestions(false);
  };

  // 📌 CLICK OUTSIDE CLOSE
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ==================== RENDER ====================
  return (
    <header
      ref={containerRef}
      className="sticky shadow-sm top-0 z-50 backdrop-blur-md bg-white/80"
    >
      {/* ========== TOP CONTACT BAR ========== */}
      <div className="bg-gray-900 text-gray-200 text-xs sm:text-sm py-2 px-4 flex justify-between items-center">
        {headerInfo && (
          <div className="flex gap-4 items-center flex-wrap">
            <a href={`tel:${headerInfo.phone}`} className="flex gap-1 items-center hover:text-blue-300">
              <MdPhone className="text-blue-400" /> {headerInfo.phone}
            </a>

            <a href={`mailto:${headerInfo.email}`} className="flex gap-1 items-center hover:text-blue-300">
              <MdEmail className="text-blue-400" /> {headerInfo.email}
            </a>

            {headerInfo.address && (
              <a
                href={`https://maps.google.com?q=${headerInfo.address}`}
                target="_blank"
                className="hidden md:flex gap-1 items-center hover:text-blue-300"
              >
                <MdLocationOn className="text-blue-400" /> {headerInfo.address}
              </a>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link href="/help">Help</Link>
          <Link href="/track">Track Order</Link>
        </div>
      </div>

      {/* ========== MAIN NAV ========== */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          {headerInfo?.logo?.url ? (
            <Image src={headerInfo.logo.url} height={50} width={50} alt={headerInfo?.title || headerInfo?.companyName || "Logo"} />
          ) : (
            <span className="text-2xl font-extrabold">{headerInfo?.title || headerInfo?.companyName || "Store"}</span>
          )}
        </Link>

        {/* DESKTOP SEARCH */}
        <div className="hidden md:flex relative w-1/2">
          <input
            className="w-full shadow-sm bg-gray-100 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          <FaSearch className="absolute right-3 top-3 text-gray-500" />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute bg-white w-full shadow-lg top-11 rounded-lg max-h-64 overflow-auto">
              {suggestions.map((p) => (
                <li
                  key={p._id}
                  onClick={() => selectProduct(p)}
                  className="flex items-center gap-2 p-2 border-b hover:bg-gray-100 cursor-pointer"
                >
                  <img src={p.images?.[0]?.url} className="w-10 h-10 object-cover rounded" />
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.category?.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-4">
          {/* Wishlist */}
          <Link href="/user-dashboard/wishlist" className="relative">
            <FaHeart className="h-6 w-6 text-gray-700" />
            {wishCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full px-1">
                {wishCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <FaShoppingCart className="h-6 w-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full px-1">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <Link href="/user-dashboard" className="flex items-center gap-2 hover:text-indigo-600">
              {user.profilePic ? (
                <div className="relative">
                  <Image
                    src={user.profilePic}
                    alt={user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full object-cover border-2 border-indigo-500"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FaUser className="text-indigo-600 text-sm" />
                </div>
              )}
              <span className="hidden sm:inline text-sm font-medium">
                {user.name?.split(" ")[0] || "User"}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1 hover:text-indigo-600">
              <FaUser /> <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {/* Mobile Toggle */}
          <button className="md:hidden" onClick={() => setMobileMenu((x) => !x)}>
            {mobileMenu ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE SEARCH */}
      {mobileMenu && (
        <div className="px-4 md:hidden">
          <input
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* MOBILE DROPDOWN */}
      {mobileMenu && (
        <nav className="md:hidden bg-white border-t px-4 py-3 space-y-3">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <hr />
          <Link href="/cart">Cart ({cartCount})</Link>
          <Link href="/user-dashboard/wishlist">Wishlist ({wishCount})</Link>
          {user ? (
            <Link href="/user-dashboard" className="flex items-center gap-2">
              {user.profilePic ? (
                <Image
                  src={user.profilePic}
                  alt={user.name || "User"}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <FaUser />
              )}
              <span>Account ({user.name?.split(" ")[0] || "User"})</span>
            </Link>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      )}
    </header>
  );
}