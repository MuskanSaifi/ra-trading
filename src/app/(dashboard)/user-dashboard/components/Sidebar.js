"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LayoutDashboard, ShoppingBag, Heart, User, Bell, LogOut, LifeBuoy } from "lucide-react";

const links = [
  { href: "/user-dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/user-dashboard/orders", label: "Your orders", icon: ShoppingBag },
  { href: "/user-dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/user-dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/user-dashboard/profile", label: "Profile & address", icon: User },
];

export default function Sidebar({ onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {}
  }, []);

  const handleNav = () => onNavigate?.();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/user/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event("userAuthChanged"));
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--store-primary)] text-sm font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{user?.name || "My account"}</p>
          <p className="truncate text-xs text-slate-500">{user?.phone || user?.email || ""}</p>
        </div>
        <button
          type="button"
          onClick={handleNav}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/user-dashboard"
              ? pathname === "/user-dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNav}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--store-primary)]/10 font-semibold text-[var(--store-primary)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/contact"
          onClick={handleNav}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <LifeBuoy className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          Help & support
        </Link>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-red-50 hover:text-red-700 hover:ring-red-200"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );
}
