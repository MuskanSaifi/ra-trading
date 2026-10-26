"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Download, RotateCcw, Truck } from "lucide-react";
import DateRangeFilter from "@/components/admin/ui/DateRangeFilter";
import { EmptyState, PageHeader, Pagination, SearchInput, TableSkeleton, Tabs } from "@/components/admin/ui";
import { rangeQuery } from "@/lib/dateRange";
import {
  ADMIN_ORDER_STATUSES,
  CANCELLABLE_STATUSES,
  TONE_CLASSES,
  formatDate,
  formatInr,
  statusLabel,
  statusTone,
} from "@/lib/orderStatus";

const PAGE_SIZE = 20;

const TAB_DEFS = [
  { key: "all", label: "All" },
  { key: "toShip", label: "To ship" },
  { key: "inTransit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returns", label: "Returns" },
  { key: "payment", label: "Payment pending" },
  { key: "refundPending", label: "Refund pending" },
];

function canShip(order) {
  return (
    CANCELLABLE_STATUSES.includes(order.status) &&
    !order.awb &&
    (order.paymentMode !== "PayU" || order.paymentStatus === "Paid")
  );
}

function paymentText(order) {
  if (order.paymentMode === "PayU") {
    return order.paymentStatus === "Paid" ? "Paid online" : `Online · ${order.paymentStatus || "Pending"}`;
  }
  return order.paymentStatus === "Paid" ? "COD · Collected" : "Cash on delivery";
}

function StatusSelect({ order, onChange, disabled }) {
  return (
    <select
      value={order.status}
      disabled={disabled}
      onChange={(e) => onChange(order, e.target.value)}
      className={`max-w-[11rem] rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[statusTone(order.status)]}`}
    >
      {ADMIN_ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}

function OrdersPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [group, setGroup] = useState(params.get("group") || "all");
  const [payment, setPayment] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [range, setRange] = useState({ preset: "all" });
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [group, payment, debounced, range]);

  const buildQuery = useCallback(
    (p, limit = PAGE_SIZE) => {
      const qs = new URLSearchParams(rangeQuery(range));
      qs.set("page", String(p));
      qs.set("limit", String(limit));
      if (group !== "all") qs.set("group", group);
      if (payment) qs.set("payment", payment);
      if (debounced) qs.set("q", debounced);
      return qs.toString();
    },
    [range, group, payment, debounced]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/admin-orders?${buildQuery(page)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setCounts(data.counts || {});
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeGroup = (key) => {
    setGroup(key);
    router.replace(key === "all" ? "/admin-dashboard/orders" : `/admin-dashboard/orders?group=${key}`, {
      scroll: false,
    });
  };

  const updateStatus = async (order, newStatus) => {
    let cancelReason = "";
    if (newStatus === "Cancelled by Admin") {
      cancelReason = prompt("Reason for cancelling this order:") || "";
      if (!cancelReason.trim()) return;
      if (
        order.paymentMode === "PayU" &&
        order.paymentStatus === "Paid" &&
        !confirm("This order was paid online. Cancelling will also send a PayU refund. Continue?")
      ) {
        return;
      }
    }
    setBusyId(order._id);
    try {
      const res = await fetch("/api/admin/admin-orders/update-order-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id, status: newStatus, cancelReason }),
      });
      const data = await res.json();
      if (!data.success || data.message !== "Order updated successfully") {
        alert(data.message || "Update failed");
      }
      fetchOrders();
    } finally {
      setBusyId(null);
    }
  };

  const ship = async (order) => {
    if (!confirm(`Book Shiprocket shipment for order #${String(order._id).slice(-8).toUpperCase()}?`)) return;
    setBusyId(order._id);
    try {
      const res = await fetch("/api/admin/shiprocket/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Shipment created" : "Shiprocket request failed"));
      fetchOrders();
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = [];
      for (let p = 1; p <= 20; p++) {
        const res = await fetch(`/api/admin/admin-orders?${buildQuery(p, 100)}`, { cache: "no-store" });
        const data = await res.json();
        if (!data.success) break;
        rows.push(...(data.orders || []));
        if (p >= (data.totalPages || 0)) break;
      }
      const header = ["Order ID", "Date", "Customer", "Phone", "City", "State", "Pincode", "Items", "Total", "Payment", "Payment status", "Status", "AWB", "Courier"];
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = rows.map((o) =>
        [
          o._id,
          new Date(o.createdAt).toLocaleString("en-IN"),
          o.address?.name,
          o.address?.phone,
          o.address?.city,
          o.address?.state,
          o.address?.pincode,
          (o.items || []).map((i) => `${i.name || i.productId?.name} x${i.quantity}`).join("; "),
          o.totalAmount,
          o.paymentMode,
          o.paymentStatus,
          o.status,
          o.awb,
          o.courierName,
        ]
          .map(esc)
          .join(",")
      );
      const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const filtersActive = payment || debounced || range.preset !== "all";
  const tabs = TAB_DEFS.filter((t) => t.key !== "refundPending" || counts.refundPending > 0).map((t) => ({
    ...t,
    count: counts[t.key],
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Orders"
        description="Confirm, ship, and track customer orders."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || !total}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
        }
      />

      <Tabs tabs={tabs} value={group} onChange={changeGroup} />

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, city, order ID or AWB"
          className="lg:w-96"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm"
          >
            <option value="">All payments</option>
            <option value="PayU">Online (PayU)</option>
            <option value="COD">Cash on delivery</option>
          </select>
          <DateRangeFilter value={range} onChange={setRange} />
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setPayment("");
                setSearch("");
                setRange({ preset: "all" });
              }}
              className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No orders found"
              description={filtersActive || group !== "all" ? "Try another tab or clear the filters." : "New orders will appear here."}
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Shipping</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const qty = (o.items || []).reduce((n, i) => n + Number(i.quantity || 0), 0);
                    return (
                      <tr key={o._id} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin-dashboard/orders/${o._id}`}
                            className="font-semibold text-[var(--store-primary)] hover:underline"
                          >
                            #{String(o._id).slice(-8).toUpperCase()}
                          </Link>
                          <p className="text-xs text-slate-500">{formatDate(o.createdAt, true)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{o.address?.name || o.userId?.name || "—"}</p>
                          <p className="text-xs text-slate-500">
                            {o.address?.phone} · {o.address?.city}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {(o.items || []).slice(0, 3).map((i, idx) => (
                                <img
                                  key={idx}
                                  src={i.productId?.images?.[0]?.url || "/placeholder.png"}
                                  alt=""
                                  className="h-8 w-8 rounded-md border-2 border-white object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-500">
                              {qty} item{qty === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="mt-1 max-w-[14rem] truncate text-xs text-slate-600">
                            {o.items?.[0]?.productId?.name || o.items?.[0]?.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{formatInr(o.totalAmount)}</p>
                          <p
                            className={`text-xs ${
                              o.paymentMode === "PayU" && o.paymentStatus !== "Paid" ? "text-amber-700" : "text-slate-500"
                            }`}
                          >
                            {paymentText(o)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect order={o} onChange={updateStatus} disabled={busyId === o._id} />
                        </td>
                        <td className="px-4 py-3">
                          {o.awb ? (
                            <div className="text-xs">
                              <p className="font-medium text-slate-800">{o.courierName || "Courier"}</p>
                              <p className="text-slate-500">AWB {o.awb}</p>
                            </div>
                          ) : canShip(o) ? (
                            <button
                              type="button"
                              disabled={busyId === o._id}
                              onClick={() => ship(o)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--store-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--store-primary-dark)] disabled:opacity-60"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              {o.shipmentId ? "Get AWB" : "Ship"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin-dashboard/orders/${o._id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Open order"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {orders.map((o) => (
                <li key={o._id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin-dashboard/orders/${o._id}`}
                        className="font-semibold text-[var(--store-primary)]"
                      >
                        #{String(o._id).slice(-8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-slate-500">{formatDate(o.createdAt, true)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatInr(o.totalAmount)}</p>
                      <p className="text-xs text-slate-500">{paymentText(o)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    {o.address?.name} · {o.address?.phone} · {o.address?.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusSelect order={o} onChange={updateStatus} disabled={busyId === o._id} />
                    {canShip(o) && (
                      <button
                        type="button"
                        disabled={busyId === o._id}
                        onClick={() => ship(o)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--store-primary)] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <Truck className="h-3.5 w-3.5" /> {o.shipmentId ? "Get AWB" : "Ship"}
                      </button>
                    )}
                    {o.awb && <span className="text-xs text-slate-500">AWB {o.awb}</span>}
                    <Link
                      href={`/admin-dashboard/orders/${o._id}`}
                      className="ml-auto text-xs font-semibold text-slate-600"
                    >
                      Details →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} label="orders" />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}
