"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, Package, Truck, CheckCircle2, User, Bell } from "lucide-react";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { getLocalUser } from "@/lib/orderClient";
import { deliveryHeadline, formatDate, formatInr, isCancelled } from "@/lib/orderStatus";

const IN_TRANSIT = ["Shipped", "Out for Delivery"];

export default function DashboardHome() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getLocalUser();
    setUser(u);
    try {
      setWishlistCount((JSON.parse(localStorage.getItem("wishlistIds")) || []).length);
    } catch {}
    if (!u?._id) return setLoading(false);
    fetch(`/api/user/order/user-orders?userId=${u._id}&limit=50`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.success && setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const placed = orders.filter((o) => o.status !== "Payment Failed" && o.status !== "Payment Pending");
  const stats = [
    { label: "Total orders", value: placed.length, icon: Package, href: "/user-dashboard/orders" },
    {
      label: "On the way",
      value: placed.filter((o) => IN_TRANSIT.includes(o.status)).length,
      icon: Truck,
      href: "/user-dashboard/orders",
    },
    {
      label: "Delivered",
      value: placed.filter((o) => ["Delivered", "Completed"].includes(o.status)).length,
      icon: CheckCircle2,
      href: "/user-dashboard/orders",
    },
    { label: "Wishlist", value: wishlistCount, icon: Heart, href: "/user-dashboard/wishlist" },
  ];
  const active = placed.filter(
    (o) => !isCancelled(o.status) && !["Delivered", "Completed"].includes(o.status)
  );
  const recent = orders.slice(0, 4);
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--store-ink)] to-[var(--store-primary)] p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {firstName ? `Hello, ${firstName}` : "Your account"}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {active.length
            ? `You have ${active.length} order${active.length > 1 ? "s" : ""} in progress.`
            : "Track orders, manage your wishlist, and update your details here."}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--store-primary)]/10 text-[var(--store-primary)]">
              <Icon size={20} />
            </span>
            <p className="mt-4 text-2xl font-bold text-slate-900">{loading ? "–" : value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Recent orders</h2>
          <Link href="/user-dashboard/orders" className="text-sm font-semibold text-[var(--store-primary)] hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse" />
        ) : recent.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600">No orders yet.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block rounded-xl bg-[var(--store-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((o) => (
              <li key={o._id}>
                <Link
                  href={`/user-dashboard/orders/${o._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <img
                    src={o.items?.[0]?.productId?.images?.[0]?.url || "/placeholder.png"}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {o.items?.[0]?.productId?.name || o.items?.[0]?.name}
                      {o.items?.length > 1 ? ` + ${o.items.length - 1} more` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(o.createdAt)} · {formatInr(o.totalAmount)} · {deliveryHeadline(o)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/user-dashboard/profile", icon: User, title: "Profile & addresses", desc: "Update your name, phone, and delivery address" },
          { href: "/user-dashboard/wishlist", icon: Heart, title: "Wishlist", desc: "Products you saved for later" },
          { href: "/user-dashboard/notifications", icon: Bell, title: "Notifications", desc: "Order and payment updates" },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 hover:shadow-md">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--store-primary)]" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{title}</span>
              <span className="block text-xs text-slate-500">{desc}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
