"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  X,
  LayoutDashboard,
  Bell,
  Send,
  Package,
  ShoppingBag,
  Users,
  UserX,
  PanelsTopLeft,
  BookOpen,
  Info,
  Mail,
  MapPin,
  Star,
  HelpCircle,
  SlidersHorizontal,
  FileText,
  MessageSquareText,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { name: "Notifications", href: "/admin-dashboard/notifications", icon: Bell },
  { name: "Send Notification", href: "/admin-dashboard/send-notification", icon: Send },
  {
    name: "Products",
    href: "/admin-dashboard/products",
    icon: Package,
    children: [
      { name: "All Products", href: "/admin-dashboard/products" },
      { name: "Categories", href: "/admin-dashboard/products/categories" },
      { name: "Brands", href: "/admin-dashboard/products/brands" },
      { name: "Attributes", href: "/admin-dashboard/products/attributes" },
    ],
  },
  { name: "Orders", href: "/admin-dashboard/orders", icon: ShoppingBag },
  { name: "Users", href: "/admin-dashboard/users", icon: Users },
  { name: "Delete Requests", href: "/admin-dashboard/delete-requests", icon: UserX },
  { name: "Sections", href: "/admin-dashboard/sections", icon: PanelsTopLeft },
  { name: "Blog", href: "/admin-dashboard/blog", icon: BookOpen },
  { name: "About Us", href: "/admin-dashboard/about-us", icon: Info },
  { name: "Contact Form", href: "/admin-dashboard/contact-form", icon: Mail },
  { name: "Contact Us", href: "/admin-dashboard/contact-us", icon: MapPin },
  { name: "Reviews", href: "/admin-dashboard/reviews", icon: Star },
  { name: "FAQ", href: "/admin-dashboard/faq", icon: HelpCircle },
  { name: "Chatbot Leads", href: "/admin-dashboard/chatbot-leads", icon: MessageSquareText },
  { name: "Policies", href: "/admin-dashboard/policies", icon: FileText },
  { name: "Settings", href: "/admin-dashboard/settings", icon: SlidersHorizontal },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deleteCount, setDeleteCount] = useState(0);

  const handleNav = () => onNavigate?.();

  useEffect(() => {
    const activeParent = navItems.find(
      (item) => item.children && pathname.startsWith(item.href)
    );
    if (activeParent) setOpenDropdown(activeParent.name);
  }, [pathname]);

  useEffect(() => {
    async function fetchDeleteCount() {
      try {
        const res = await fetch("/api/admin/delete-account-requests/count");
        const data = await res.json();
        if (data.success) setDeleteCount(data.count);
      } catch {
        // ignore
      }
    }
    fetchDeleteCount();
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const linkBase =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";
  const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const active = "bg-[#fff4e6] text-[#b45309] ring-1 ring-[#ff9900]/30";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
        <Link
          href="/admin-dashboard"
          onClick={handleNav}
          className="min-w-0 flex-1"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff9900]">
            Admin
          </p>
          <p className="truncate text-lg font-bold text-slate-900">Ra Trading</p>
        </Link>
        <button
          type="button"
          onClick={handleNav}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (!item.children) {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNav}
                    className={`${linkBase} ${isActive ? active : inactive}`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={2} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.name === "Delete Requests" && deleteCount > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        {deleteCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }

            const parentActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => toggleDropdown(item.name)}
                  className={`${linkBase} w-full text-left ${
                    parentActive ? active : inactive
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={2} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {openDropdown === item.name ? (
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                  )}
                </button>
                {openDropdown === item.name && (
                  <ul className="ml-2 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={handleNav}
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              childActive
                                ? "font-semibold text-[#b45309] bg-[#fff4e6]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3 md:hidden">
        <p className="px-3 text-[11px] leading-relaxed text-slate-400">
          Tap dim area or ✕ to close.
        </p>
      </div>
    </div>
  );
}
