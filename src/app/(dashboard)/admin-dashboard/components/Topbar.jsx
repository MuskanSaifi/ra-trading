"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Settings, ExternalLink } from "lucide-react";

const titleMap = [
  { prefix: "/admin-dashboard/products/categories", label: "Categories" },
  { prefix: "/admin-dashboard/products/brands", label: "Brands" },
  { prefix: "/admin-dashboard/products/attributes", label: "Attributes" },
  { prefix: "/admin-dashboard/products/add", label: "Add product" },
  { prefix: "/admin-dashboard/products/edit", label: "Edit product" },
  { prefix: "/admin-dashboard/products", label: "Products" },
  { prefix: "/admin-dashboard/orders", label: "Orders" },
  { prefix: "/admin-dashboard/users", label: "Users" },
  { prefix: "/admin-dashboard/notifications", label: "Notifications" },
  { prefix: "/admin-dashboard/send-notification", label: "Send notification" },
  { prefix: "/admin-dashboard/delete-requests", label: "Delete requests" },
  { prefix: "/admin-dashboard/sections", label: "Sections" },
  { prefix: "/admin-dashboard/blog", label: "Blog" },
  { prefix: "/admin-dashboard/about-us", label: "About us" },
  { prefix: "/admin-dashboard/contact-form", label: "Contact form" },
  { prefix: "/admin-dashboard/contact-us", label: "Contact us" },
  { prefix: "/admin-dashboard/reviews", label: "Reviews" },
  { prefix: "/admin-dashboard/faq", label: "FAQ" },
  { prefix: "/admin-dashboard/settings", label: "Settings" },
  { prefix: "/admin-dashboard", label: "Dashboard" },
];

function pageTitle(pathname) {
  const hit = titleMap.find((t) => pathname === t.prefix || pathname.startsWith(t.prefix + "/"));
  return hit?.label ?? "Admin";
}

export default function Topbar({ onOpenSidebar }) {
  const pathname = usePathname();
  const title = pageTitle(pathname || "");

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 sm:px-5 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h1>
        <p className="hidden text-xs text-slate-500 sm:block">Ra Trading admin</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ExternalLink className="h-4 w-4" />
          Store
        </Link>
        <Link
          href="/admin-dashboard/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
        </Link>
        <Link
          href="/admin-dashboard/settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#ff9900]"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
