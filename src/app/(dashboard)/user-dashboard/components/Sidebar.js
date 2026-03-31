"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  User,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/user-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user-dashboard/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/user-dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/user-dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar({ onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff9900]">
            Account
          </p>
          <h2 className="truncate text-lg font-bold text-slate-900">Dashboard</h2>
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
                  ? "bg-[#fff4e6] text-[#b45309] ring-1 ring-[#ff9900]/30"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Logout
        </button>
      </div>

      <p className="px-4 pb-3 text-[11px] text-slate-400 md:hidden">Tap dim area to close.</p>
    </div>
  );
}
