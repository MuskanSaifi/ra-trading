"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Search, Truck, CreditCard } from "lucide-react";
import OrderTracker from "@/components/orders/OrderTracker";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import { cancelOrderRequest, getLocalUser, retryPayment } from "@/lib/orderClient";
import {
  canCustomerCancel,
  deliveryHeadline,
  formatDate,
  formatInr,
  isCancelled,
  isPaymentIncomplete,
  statusTone,
} from "@/lib/orderStatus";

const FILTERS = [
  { key: "all", label: "All orders" },
  { key: "active", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function matchesFilter(order, filter) {
  if (filter === "delivered") return ["Delivered", "Completed"].includes(order.status);
  if (filter === "cancelled") return isCancelled(order.status) || order.status === "Payment Failed";
  if (filter === "active")
    return !["Delivered", "Completed"].includes(order.status) && !isCancelled(order.status) && order.status !== "Payment Failed";
  return true;
}

const HEADLINE_TONE = {
  green: "text-green-700",
  red: "text-red-700",
  blue: "text-blue-700",
  amber: "text-amber-700",
  slate: "text-slate-900",
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchOrders = async () => {
    const user = getLocalUser();
    if (!user?._id) return setLoading(false);
    try {
      const res = await fetch(`/api/user/order/user-orders?userId=${user._id}&limit=50`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        matchesFilter(o, filter) &&
        (!q ||
          String(o._id).toLowerCase().includes(q) ||
          o.items?.some((i) => (i.productId?.name || i.name || "").toLowerCase().includes(q)))
    );
  }, [orders, filter, query]);

  const confirmCancel = async (reason) => {
    setBusy(true);
    try {
      const data = await cancelOrderRequest(cancelTarget._id, reason);
      setNotice(data.message || (data.success ? "Order cancelled" : "Could not cancel order"));
      if (data.success) {
        setCancelTarget(null);
        fetchOrders();
      }
    } finally {
      setBusy(false);
    }
  };

  const onRetry = async (orderId) => {
    setBusy(true);
    const data = await retryPayment(orderId);
    if (!data.success) {
      setNotice(data.message || "Could not start payment");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your orders</h1>
          <p className="text-sm text-slate-500">Track, cancel, or get help with your orders.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or order ID"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--store-primary)]"
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = orders.filter((o) => matchesFilter(o, f.key)).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f.key
                  ? "bg-[var(--store-primary)] text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">
            {orders.length ? "No orders match this filter" : "You haven't placed any orders yet"}
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-xl bg-[var(--store-primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((order) => (
            <article key={order._id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <header className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs sm:grid-cols-4">
                <div>
                  <p className="font-medium uppercase tracking-wide text-slate-500">Order placed</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatInr(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="font-medium uppercase tracking-wide text-slate-500">Payment</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {order.paymentMode === "PayU" ? "Online" : "Cash on delivery"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-medium uppercase tracking-wide text-slate-500">
                    Order # {String(order._id).slice(-8).toUpperCase()}
                  </p>
                  <Link
                    href={`/user-dashboard/orders/${order._id}`}
                    className="mt-0.5 inline-block text-sm font-semibold text-[var(--store-primary)] hover:underline"
                  >
                    View order details
                  </Link>
                </div>
              </header>

              <div className="space-y-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={`text-lg font-bold ${HEADLINE_TONE[statusTone(order.status)]}`}>
                    {deliveryHeadline(order)}
                  </h2>
                  <OrderStatusBadge status={order.status} />
                </div>

                {isCancelled(order.status) && order.cancelReason && (
                  <p className="text-sm text-slate-600">Reason: {order.cancelReason}</p>
                )}
                {order.paymentStatus === "Refund Initiated" && (
                  <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    Refund of {formatInr(order.totalAmount)} initiated to your original payment method.
                  </p>
                )}
                {order.status === "Payment Failed" && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    Your payment did not go through, so this order is not confirmed. No money was deducted; if it was, it will be returned by your bank.
                  </p>
                )}

                <OrderTracker order={order} compact />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <ul className="flex-1 space-y-3">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-4">
                        <img
                          src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {item.productId?.name || item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty {item.quantity} · {formatInr(item.price)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex w-full flex-col gap-2 lg:w-56">
                    {isPaymentIncomplete(order) && order.paymentMode === "PayU" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRetry(order._id)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <CreditCard size={16} /> Complete payment
                      </button>
                    )}
                    {order.awb && (
                      <Link
                        href={`/user-dashboard/orders/${order._id}#tracking`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] py-2.5 text-sm font-semibold text-white"
                      >
                        <Truck size={16} /> Track package
                      </Link>
                    )}
                    <Link
                      href={`/user-dashboard/orders/${order._id}`}
                      className="rounded-xl py-2.5 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                    >
                      Order details
                    </Link>
                    {canCustomerCancel(order) && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(order)}
                        className="rounded-xl py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CancelOrderModal
        order={cancelTarget}
        busy={busy}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
