"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CreditCard, ExternalLink, MapPin, Phone, Truck } from "lucide-react";
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
  statusLabel,
} from "@/lib/orderStatus";

const PAYMENT_STATUS_TEXT = {
  Paid: "Paid",
  Pending: "Pay on delivery",
  Failed: "Payment failed",
  "Refund Initiated": "Refund initiated",
  "Refund Pending": "Refund being processed",
  "Refund Completed": "Refunded",
  "Not charged": "Not charged",
};

export default function UserOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const user = getLocalUser();
    if (!user?._id) return setLoading(false);
    try {
      const res = await fetch(`/api/user/order/${id}?userId=${user._id}`, { cache: "no-store" });
      const data = await res.json();
      setOrder(data.success ? data.order : null);
      if (data.success && data.order.awb) {
        fetch(`/api/user/order/track?orderId=${id}&userId=${user._id}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((t) => setTracking(t))
          .catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const confirmCancel = async (reason) => {
    setBusy(true);
    try {
      const data = await cancelOrderRequest(order._id, reason);
      setNotice(data.message || "");
      if (data.success) {
        setShowCancel(false);
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const onRetry = async () => {
    setBusy(true);
    const data = await retryPayment(order._id);
    if (!data.success) {
      setNotice(data.message || "Could not start payment");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-slate-700">Order not found.</p>
        <Link href="/user-dashboard/orders" className="mt-3 inline-block text-sm font-semibold text-[var(--store-primary)]">
          Back to orders
        </Link>
      </div>
    );
  }

  const itemsTotal = (order.items || []).reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
    0
  );
  const shipping = Math.max(0, Number(order.totalAmount || 0) - itemsTotal);
  const history = [...(order.statusHistory || [])].reverse();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/user-dashboard/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Your orders
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order details</h1>
          <p className="text-sm text-slate-500">
            Ordered on {formatDate(order.createdAt)} · Order # {String(order._id).slice(-8).toUpperCase()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {notice && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>
      )}

      <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{deliveryHeadline(order)}</h2>
          <div className="flex flex-wrap gap-2">
            {isPaymentIncomplete(order) && order.paymentMode === "PayU" && (
              <button
                type="button"
                disabled={busy}
                onClick={onRetry}
                className="flex items-center gap-2 rounded-xl bg-[var(--store-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <CreditCard size={16} /> Complete payment
              </button>
            )}
            {canCustomerCancel(order) && (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                Cancel order
              </button>
            )}
          </div>
        </div>

        {isCancelled(order.status) && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : "."}
          </p>
        )}

        <OrderTracker order={order} />
      </section>

      {order.awb && (
        <section id="tracking" className="scroll-mt-24 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Truck size={20} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{order.courierName || "Courier"}</p>
                <p className="text-sm text-slate-500">Tracking ID: {order.awb}</p>
              </div>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--store-primary)] hover:underline"
              >
                Track on courier site <ExternalLink size={14} />
              </a>
            )}
          </div>

          {tracking?.events?.length ? (
            <ol className="mt-5 space-y-4 border-l-2 border-slate-200 pl-5">
              {tracking.events.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${
                      i === 0 ? "bg-green-600 ring-4 ring-green-600/20" : "bg-slate-300"
                    }`}
                  />
                  <p className="text-sm font-semibold text-slate-900">{e.status}</p>
                  <p className="text-xs text-slate-500">
                    {e.location ? `${e.location} · ` : ""}
                    {e.at}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              {tracking ? "Courier updates will appear here once the package is picked up." : "Loading courier updates…"}
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:col-span-2">
          <h2 className="mb-4 font-bold text-slate-900">Items in this order</h2>
          <ul className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 py-3">
                <img
                  src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {item.productId?.name || item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatInr(Number(item.price) * Number(item.quantity))}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 font-bold text-slate-900">Delivery address</h2>
            <p className="text-sm font-semibold text-slate-800">{order.address?.name}</p>
            <p className="mt-1 flex gap-2 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>
                {order.address?.street}, {order.address?.city}, {order.address?.state} – {order.address?.pincode}
              </span>
            </p>
            {order.address?.phone && (
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} /> {order.address.phone}
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 font-bold text-slate-900">Payment summary</h2>
            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt>Items</dt>
                <dd>{formatInr(itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatInr(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <dt>Order total</dt>
                <dd>{formatInr(order.totalAmount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              {order.paymentMode === "PayU" ? "Paid online (PayU)" : "Cash on delivery"} ·{" "}
              {PAYMENT_STATUS_TEXT[order.paymentStatus] || order.paymentStatus}
            </p>
          </section>
        </div>
      </div>

      {history.length > 0 && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-900">Order activity</h2>
          <ol className="space-y-3">
            {history.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-36 shrink-0 text-xs text-slate-500">{formatDate(h.at, true)}</span>
                <span>
                  <span className="font-semibold text-slate-900">{statusLabel(h.status)}</span>
                  {h.note && <span className="text-slate-500"> — {h.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-center text-sm text-slate-500">
        Need help with this order?{" "}
        <Link href="/contact" className="font-semibold text-[var(--store-primary)] hover:underline">
          Contact support
        </Link>
      </p>

      {showCancel && (
        <CancelOrderModal
          order={order}
          busy={busy}
          onClose={() => setShowCancel(false)}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  );
}
