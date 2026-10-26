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
  Image as ImageIcon,
  BookOpen,
  Info,
  Mail,
  MapPin,
  Star,
  HelpCircle,
  SlidersHorizontal,
  FileText,
  MessageSquareText,
  Video,
  CreditCard,
  LogOut,
} from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
      { name: "Notifications", href: "/admin-dashboard/notifications", icon: Bell },
      { name: "Send notification", href: "/admin-dashboard/send-notification", icon: Send },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "Orders", href: "/admin-dashboard/orders", icon: ShoppingBag, badge: "toShip" },
      { name: "Customers", href: "/admin-dashboard/users", icon: Users },
      { name: "Delete requests", href: "/admin-dashboard/delete-requests", icon: UserX, badge: "deleteRequests" },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        name: "Products",
        href: "/admin-dashboard/products",
        icon: Package,
        children: [
          { name: "All products", href: "/admin-dashboard/products" },
          { name: "Categories", href: "/admin-dashboard/products/categories" },
          { name: "Brands", href: "/admin-dashboard/products/brands" },
          { name: "Attributes", href: "/admin-dashboard/products/attributes" },
        ],
      },
      { name: "Reviews", href: "/admin-dashboard/reviews", icon: Star },
    ],
  },
  {
    title: "Leads",
    items: [
      { name: "Contact messages", href: "/admin-dashboard/contact-form", icon: Mail },
      { name: "Chatbot leads", href: "/admin-dashboard/chatbot-leads", icon: MessageSquareText },
    ],
  },
  {
    title: "Website",
    items: [
      { name: "Sections", href: "/admin-dashboard/sections", icon: PanelsTopLeft },
      { name: "Home graphics", href: "/admin-dashboard/graphics", icon: ImageIcon },
      { name: "Reels", href: "/admin-dashboard/reels", icon: Video },
      { name: "Blog", href: "/admin-dashboard/blog", icon: BookOpen },
      { name: "About us", href: "/admin-dashboard/about-us", icon: Info },
      { name: "Contact details", href: "/admin-dashboard/contact-us", icon: MapPin },
      { name: "FAQ", href: "/admin-dashboard/faq", icon: HelpCircle },
      { name: "Policies", href: "/admin-dashboard/policies", icon: FileText },
    ],
  },
  {
    title: "Setup",
    items: [
      { name: "Payments & shipping", href: "/admin-dashboard/integrations", icon: CreditCard },
      { name: "Settings", href: "/admin-dashboard/settings", icon: SlidersHorizontal },
    ],
  },
];

function isActive(pathname, href) {
  if (href === "/admin-dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname() || "";
  const [openDropdown, setOpenDropdown] = useState(null);
  const [badges, setBadges] = useState({});

  const handleNav = () => onNavigate?.();

  useEffect(() => {
    const parent = sections
      .flatMap((s) => s.items)
      .find((item) => item.children && pathname.startsWith(item.href));
    if (parent) setOpenDropdown(parent.name);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/admin/delete-account-requests/count").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/admin-orders?group=toShip&limit=1").then((r) => r.json()).catch(() => null),
    ]).then(([del, ship]) => {
      if (!alive) return;
      setBadges({
        deleteRequests: del?.success ? del.count : 0,
        toShip: ship?.success ? ship.total : 0,
      });
    });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/admin/setting/logout").catch(() => {});
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-login";
  };

  const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const active = "bg-[var(--store-primary)]/10 font-semibold text-[var(--store-primary)]";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
        <Link href="/admin-dashboard" onClick={handleNav} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--store-primary)] text-sm font-bold text-white">
            RA
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-slate-900">Ra Trading</span>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">Admin</span>
          </span>
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

      <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = item.badge ? badges[item.badge] : 0;

                if (!item.children) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleNav}
                        className={`${linkBase} ${isActive(pathname, item.href) ? active : inactive}`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {badge > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                              item.badge === "toShip" ? "bg-amber-500" : "bg-red-600"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                }

                const parentActive = pathname.startsWith(item.href);
                const open = openDropdown === item.name;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(open ? null : item.name)}
                      className={`${linkBase} w-full text-left ${parentActive ? active : inactive}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                      )}
                    </button>
                    {open && (
                      <ul className="ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={handleNav}
                              className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                pathname === child.href
                                  ? "font-semibold text-[var(--store-primary)]"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </div>
  );
}
