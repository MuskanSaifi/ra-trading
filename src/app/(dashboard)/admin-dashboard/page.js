"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Receipt,
  UserPlus,
  PackageCheck,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import DateRangeFilter from "@/components/admin/ui/DateRangeFilter";
import { Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { rangeLabel, rangeQuery } from "@/lib/dateRange";
import { formatDate, formatInr, ORDER_GROUPS, statusLabel } from "@/lib/orderStatus";

const STATUS_GROUP_ROWS = [
  { key: "toShip", label: "To ship", color: "bg-amber-500" },
  { key: "inTransit", label: "In transit", color: "bg-blue-500" },
  { key: "delivered", label: "Delivered", color: "bg-green-600" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { key: "returns", label: "Returns / refunds", color: "bg-purple-500" },
  { key: "payment", label: "Payment pending / failed", color: "bg-slate-400" },
];

function SalesChart({ series }) {
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const total = series.reduce((s, d) => s + d.revenue, 0);
  if (!total) {
    return <p className="py-16 text-center text-sm text-slate-500">No sales in this period.</p>;
  }
  const labelEvery = Math.ceil(series.length / 8);
  return (
    <div>
      <div className="flex h-48 items-end gap-[3px]">
        {series.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-[var(--store-primary)]/80 transition group-hover:bg-[var(--store-primary)]"
              style={{ height: `${Math.max(d.revenue ? 4 : 0, (d.revenue / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
              {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              : {formatInr(d.revenue)} · {d.orders} orders
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10px] text-slate-400">
        {series.map((d, i) => (
          <span key={d.date} className="flex-1 truncate text-center">
            {i % labelEvery === 0
              ? new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [range, setRange] = useState({ preset: "30d" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetch(`/api/admin/dashboard/stats?${rangeQuery(range)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || d.error || "Could not load dashboard");
      })
      .catch(() => alive && setError("Could not load dashboard"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  const groups = useMemo(() => {
    const counts = data?.statusBreakdown || {};
    const rows = STATUS_GROUP_ROWS.map((g) => ({
      ...g,
      count: ORDER_GROUPS[g.key].reduce((n, s) => n + (counts[s] || 0), 0),
    }));
    const total = rows.reduce((n, r) => n + r.count, 0);
    return { rows, total };
  }, [data]);

  const s = data?.summary;
  const period = rangeLabel(range).toLowerCase();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description={`Sales and orders for ${period}.`}
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          icon={IndianRupee}
          loading={loading}
          value={formatInr(s?.revenue)}
          change={s?.change?.revenue}
          hint={s?.change ? "vs previous period" : "excludes cancelled"}
        />
        <StatCard
          label="Orders"
          icon={ShoppingBag}
          tone="blue"
          loading={loading}
          value={s?.orders ?? 0}
          change={s?.change?.orders}
          hint={s ? `${s.cancelled} cancelled` : ""}
        />
        <StatCard
          label="Average order value"
          icon={Receipt}
          tone="green"
          loading={loading}
          value={formatInr(s?.avgOrderValue)}
          hint={s ? `Online ${formatInr(s.onlineRevenue)} · COD ${formatInr(s.codRevenue)}` : ""}
        />
        <StatCard
          label="New customers"
          icon={UserPlus}
          tone="amber"
          loading={loading}
          value={s?.newCustomers ?? 0}
          change={s?.change?.newCustomers}
          hint={data ? `${data.totals.customers} total` : ""}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Orders to ship",
            value: data?.actions.toShip,
            icon: PackageCheck,
            href: "/admin-dashboard/orders?group=toShip",
            tone: "text-amber-700 bg-amber-50",
          },
          {
            label: "Awaiting online payment",
            value: data?.actions.awaitingPayment,
            icon: CreditCard,
            href: "/admin-dashboard/orders?group=payment",
            tone: "text-slate-700 bg-slate-100",
          },
          {
            label: "Refunds needing attention",
            value: data?.actions.refundsPending,
            icon: RotateCcw,
            href: "/admin-dashboard/orders?group=refundPending",
            tone: "text-red-700 bg-red-50",
          },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[var(--store-primary)]/40 hover:shadow"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tone}`}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-xl font-bold text-slate-900">{loading ? "–" : a.value ?? 0}</span>
              <span className="text-sm text-slate-500">{a.label}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Daily sales"
          actions={<span className="text-xs text-slate-500">{range.preset === "all" ? "Last 30 days" : rangeLabel(range)}</span>}
        >
          {loading ? <div className="h-52 animate-pulse rounded-xl bg-slate-100" /> : <SalesChart series={data?.series || []} />}
        </Card>

        <Card title="Orders by status">
          {loading ? (
            <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
          ) : groups.total === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No orders in this period.</p>
          ) : (
            <ul className="space-y-3">
              {groups.rows.map((g) => (
                <li key={g.key}>
                  <Link href={`/admin-dashboard/orders?group=${g.key}`} className="block">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{g.label}</span>
                      <span className="font-semibold text-slate-900">{g.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${g.color}`}
                        style={{ width: `${(g.count / groups.total) * 100}%` }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          padded={false}
          title="Recent orders"
          actions={
            <Link href="/admin-dashboard/orders" className="text-sm font-semibold text-[var(--store-primary)] hover:underline">
              View all
            </Link>
          }
        >
          {loading ? (
            <div className="h-48 animate-pulse" />
          ) : !data?.recentOrders?.length ? (
            <div className="p-5">
              <EmptyState title="No orders yet" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin-dashboard/orders/${o._id}`}
                          className="font-semibold text-[var(--store-primary)] hover:underline"
                        >
                          #{String(o._id).slice(-8).toUpperCase()}
                        </Link>
                        <p className="text-xs text-slate-500">{formatDate(o.createdAt, true)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{o.customer || "—"}</p>
                        <p className="text-xs text-slate-500">{o.city}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{formatInr(o.totalAmount)}</p>
                        <p className="text-xs text-slate-500">{o.paymentMode === "PayU" ? "Online" : "COD"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Stock alerts"
          actions={
            <Link href="/admin-dashboard/products" className="text-sm font-semibold text-[var(--store-primary)] hover:underline">
              Products
            </Link>
          }
        >
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-lg font-bold text-slate-900">{data?.catalog.totalProducts ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Products</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2">
                  <p className="text-lg font-bold text-amber-700">{data?.catalog.lowStock ?? 0}</p>
                  <p className="text-[11px] text-amber-700">Low stock</p>
                </div>
                <div className="rounded-xl bg-red-50 p-2">
                  <p className="text-lg font-bold text-red-700">{data?.catalog.outOfStock ?? 0}</p>
                  <p className="text-[11px] text-red-700">Out of stock</p>
                </div>
              </div>
              {data?.catalog.lowStockItems?.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.catalog.lowStockItems.map((p) => (
                    <li key={p._id} className="flex items-center gap-3 py-2">
                      <img
                        src={p.images?.[0]?.url || "/placeholder.png"}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                      <Link
                        href={`/admin-dashboard/products/edit/${p._id}`}
                        className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-[var(--store-primary)]"
                      >
                        {p.name}
                      </Link>
                      <span
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          Number(p.stock) <= 0 ? "text-red-700" : "text-amber-700"
                        }`}
                      >
                        {Number(p.stock) <= 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                        {Number(p.stock) <= 0 ? "Out" : `${p.stock} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">All products are well stocked.</p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
