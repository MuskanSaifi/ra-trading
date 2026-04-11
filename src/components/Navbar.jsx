"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaHeart,
  FaShoppingCart,
  FaUser,
  FaBars,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { ChevronDown } from "lucide-react";

function cartSubtotal() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return cart.reduce((s, i) => s + Number(i.price || 0) * (i.quantity || 1), 0);
  } catch {
    return 0;
  }
}

export default function Navbar() {
  const router = useRouter();

  const [headerInfo, setHeaderInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  const [categories, setCategories] = useState([]);
  const [searchCategory, setSearchCategory] = useState("all");

  const containerRef = useRef(null);

  const syncCounts = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const wish = JSON.parse(localStorage.getItem("wishlistIds") || "[]");
    const totalQty = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
    setCartCount(totalQty);
    setWishCount(wish.length);
    setSubtotal(cartSubtotal());
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, []);

  useEffect(() => {
    fetch("/api/store/contact-section", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setHeaderInfo(d?.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/store/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncCounts();
    window.addEventListener("storage", syncCounts);
    const onCart = () => syncCounts();
    const onAuth = () => syncCounts();
    window.addEventListener("cartUpdated", onCart);
    window.addEventListener("userAuthChanged", onAuth);
    return () => {
      window.removeEventListener("storage", syncCounts);
      window.removeEventListener("cartUpdated", onCart);
      window.removeEventListener("userAuthChanged", onAuth);
    };
  }, [syncCounts]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/store/products?search=${encodeURIComponent(query)}&limit=6`,
          { cache: "no-store" }
        );
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

  const runShopSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (searchCategory && searchCategory !== "all") params.set("category", searchCategory);
    router.push(`/shop?${params.toString()}`);
    setShowSuggestions(false);
    setMobileMenu(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const brandLabel = headerInfo?.title || headerInfo?.companyName || "Store";

  return (
    <div ref={containerRef} className="bg-white shadow-md w-full max-w-full min-w-0 overflow-x-clip">
      <div className="bg-[var(--store-ink)] text-gray-200 text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {headerInfo && (
            <div className="flex gap-4 items-center flex-wrap min-w-0">
              {headerInfo.phone?.trim() ? (
                <a
                  href={`tel:${headerInfo.phone.trim()}`}
                  className="flex gap-1 items-center hover:text-[var(--store-primary)] min-w-0"
                >
                  <MdPhone className="text-[var(--store-primary)] shrink-0" />
                  <span className="truncate">{headerInfo.phone.trim()}</span>
                </a>
              ) : null}
              {headerInfo.email?.trim() ? (
                <a
                  href={`mailto:${headerInfo.email.trim()}`}
                  className="hidden sm:flex gap-1 items-center hover:text-[var(--store-primary)] min-w-0"
                >
                  <MdEmail className="text-[var(--store-primary)] shrink-0" />
                  <span className="truncate max-w-[14rem]">{headerInfo.email.trim()}</span>
                </a>
              ) : null}
              {headerInfo.address?.trim() ? (
                <a
                  href={`https://maps.google.com?q=${encodeURIComponent(headerInfo.address.trim())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:flex gap-1 items-center hover:text-[var(--store-primary)] min-w-0"
                >
                  <MdLocationOn className="text-[var(--store-primary)] shrink-0" />
                  <span className="truncate max-w-[18rem]">{headerInfo.address.trim()}</span>
                </a>
              ) : null}
              {!headerInfo.phone?.trim() &&
                !headerInfo.email?.trim() &&
                !headerInfo.address?.trim() &&
                (headerInfo.companyName?.trim() || headerInfo.title?.trim()) && (
                  <span className="text-gray-300">
                    {headerInfo.companyName?.trim() || headerInfo.title?.trim()}
                  </span>
                )}
            </div>
          )}
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/help" className="hover:text-[var(--store-primary)]">
              Help
            </Link>
            <Link href="/track" className="hover:text-[var(--store-primary)]">
              Track order
            </Link>
            <Link href="/blog" className="hover:text-[var(--store-primary)] hidden sm:inline">
              Blog
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {headerInfo?.logo?.url ? (
            <Image
              src={headerInfo.logo.url}
              height={48}
              width={48}
              alt={brandLabel}
              className="object-contain"
            />
          ) : (
            <span className="text-2xl font-black tracking-tight">
              <span className="text-[var(--store-primary)]">{brandLabel.slice(0, 1)}</span>
              <span className="text-[var(--store-ink)]">{brandLabel.slice(1) || "Store"}</span>
            </span>
          )}
        </Link>

        <form
          onSubmit={runShopSearch}
          className="hidden md:flex flex-1 min-w-0 max-w-2xl mx-4 gap-2 items-stretch"
        >
          <div className="relative shrink-0">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="h-full appearance-none pl-3 pr-8 py-2.5 rounded-l-lg border border-r-0 border-[var(--store-border)] bg-[var(--store-surface)] text-sm font-medium text-[var(--store-ink)] outline-none cursor-pointer"
              aria-label="Category filter for search"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-0">
            <input
              className="w-full h-full bg-[var(--store-surface)] border border-[var(--store-border)] border-l-0 pl-3 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--store-primary)]/40"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute bg-white w-full shadow-xl top-full mt-1 rounded-lg max-h-64 overflow-auto z-50 border border-[var(--store-border)]">
                {suggestions.map((p) => (
                  <li
                    key={p._id}
                    onClick={() => selectProduct(p)}
                    className="flex items-center gap-2 p-2 border-b border-gray-100 hover:bg-[var(--store-primary-soft)] cursor-pointer"
                  >
                    <img src={p.images?.[0]?.url} className="w-10 h-10 object-cover rounded" alt="" />
                    <span className="flex-1 text-sm">{p.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            className="shrink-0 px-5 rounded-r-lg bg-[var(--store-primary)] text-white font-bold text-sm hover:bg-[var(--store-primary-dark)] transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 sm:gap-5 ml-auto">
          <Link href="/user-dashboard/wishlist" className="relative p-1 text-[var(--store-ink)] hover:text-[var(--store-primary)]">
            <FaHeart className="h-6 w-6" />
            {wishCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--store-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {wishCount}
              </span>
            )}
          </Link>

          <Link href="/cart" className="relative flex items-center gap-2 p-1 text-[var(--store-ink)] hover:text-[var(--store-primary)]">
            <FaShoppingCart className="h-6 w-6" />
            <span className="hidden lg:flex flex-col text-xs leading-tight">
              <span className="text-gray-500">Your cart</span>
              <span className="font-bold text-[var(--store-primary)]">
                ₹{subtotal.toLocaleString()}
              </span>
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 lg:right-auto lg:left-5 bg-[var(--store-ink)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link href="/user-dashboard" className="hidden sm:flex items-center gap-2 hover:text-[var(--store-primary)] text-[var(--store-ink)]">
              {user.profilePic ? (
                <Image
                  src={user.profilePic}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover border-2 border-[var(--store-primary)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--store-primary-soft)] flex items-center justify-center">
                  <FaUser className="text-[var(--store-primary)] text-sm" />
                </div>
              )}
              <span className="text-sm font-semibold max-w-[100px] truncate">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="hidden sm:flex items-center gap-1 font-semibold text-[var(--store-ink)] hover:text-[var(--store-primary)]">
              <FaUser /> Login
            </Link>
          )}

          <button type="button" className="md:hidden p-1" onClick={() => setMobileMenu((x) => !x)} aria-label="Menu">
            {mobileMenu ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      <div className="hidden md:block bg-[var(--store-primary)] text-[var(--store-ink)] w-full min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-sm font-bold min-w-0">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
            <Link
              href="/all-categories"
              className="inline-flex items-center gap-2 bg-[var(--store-ink)] text-white px-4 py-2 rounded-md hover:opacity-90"
            >
              All categories
            </Link>
            <nav className="flex items-center gap-5">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
              <Link href="/blog" className="hover:underline">
                Blog
              </Link>
              <Link href="/about" className="hover:underline">
                About
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </nav>
          </div>
          {headerInfo?.phone?.trim() && (
            <a
              href={`tel:${headerInfo.phone.trim()}`}
              className="hidden lg:inline-flex items-center gap-2 font-black"
            >
              <MdPhone /> {headerInfo.phone.trim()}
            </a>
          )}
        </div>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-3">
          <form onSubmit={runShopSearch} className="flex gap-2">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="border rounded-lg text-sm px-2 py-2 bg-[var(--store-surface)]"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-[var(--store-primary)] px-3 rounded-lg font-bold">
              Go
            </button>
          </form>
          <nav className="flex flex-col gap-2 font-semibold">
            <Link href="/" onClick={() => setMobileMenu(false)}>
              Home
            </Link>
            <Link href="/shop" onClick={() => setMobileMenu(false)}>
              Shop
            </Link>
            <Link href="/blog" onClick={() => setMobileMenu(false)}>
              Blog
            </Link>
            <Link href="/about" onClick={() => setMobileMenu(false)}>
              About
            </Link>
            <Link href="/contact" onClick={() => setMobileMenu(false)}>
              Contact
            </Link>
            <Link href="/all-categories" onClick={() => setMobileMenu(false)}>
              All categories
            </Link>
            <hr />
            <Link href="/cart" onClick={() => setMobileMenu(false)}>
              Cart ({cartCount}) — ₹{subtotal.toLocaleString()}
            </Link>
            <Link href="/user-dashboard/wishlist" onClick={() => setMobileMenu(false)}>
              Wishlist ({wishCount})
            </Link>
            {user ? (
              <Link href="/user-dashboard" onClick={() => setMobileMenu(false)}>
                Account
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileMenu(false)}>
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
