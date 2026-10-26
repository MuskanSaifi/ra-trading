"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ADMIN_ORDER_STATUSES as ORDER_STATUSES } from "@/lib/orderStatus";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/admin-orders/single-order?id=${id}`);
      const data = await res.json();
      if (data.success) setOrder(data.order);
      else setOrder(null);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus) => {
    let cancelReason = "";
    if (newStatus === "Cancelled by Admin") {
      cancelReason = prompt("Cancellation reason:") || "";
      if (!cancelReason.trim()) return alert("Reason required");
    }
    if (
      newStatus === "Cancelled by Admin" &&
      order.paymentMode === "PayU" &&
      order.paymentStatus === "Paid" &&
      !confirm("This order was paid online. Cancelling will also send a PayU refund. Continue?")
    ) {
      return;
    }
    setBusy("status");
    try {
      const res = await fetch("/api/admin/admin-orders/update-order-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status: newStatus, cancelReason }),
      });
      const data = await res.json();
      if (!data.success || data.message !== "Order updated successfully") {
        alert(data.message || "Update failed");
      }
      await fetchOrder();
    } finally {
      setBusy("");
    }
  };

  const shipViaShiprocket = async () => {
    if (!confirm("Create Shiprocket shipment + AWB?")) return;
    setBusy("ship");
    try {
      const res = await fetch("/api/admin/shiprocket/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Done" : "Failed"));
      await fetchOrder();
    } finally {
      setBusy("");
    }
  };

  const generateAwb = async () => {
    setBusy("awb");
    try {
      const res = await fetch("/api/admin/shiprocket/assign-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "AWB done" : "Failed"));
      await fetchOrder();
    } finally {
      setBusy("");
    }
  };

  const addManualAwb = async () => {
    const awb = prompt("Enter AWB:");
    if (!awb?.trim()) return;
    const courierName = prompt("Courier (optional):") || "";
    setBusy("awb");
    try {
      const res = await fetch("/api/admin/shiprocket/assign-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, awb: awb.trim(), courierName }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Saved" : "Failed"));
      await fetchOrder();
    } finally {
      setBusy("");
    }
  };

  const trackAwb = async () => {
    setBusy("track");
    try {
      const res = await fetch(`/api/admin/shiprocket/track?orderId=${id}`);
      const data = await res.json();
      if (!data.success) return alert(data.message || "Track failed");
      const status =
        data.tracking?.tracking_data?.shipment_status ||
        data.tracking?.shipment_status ||
        "Updated";
      alert(`Tracking: ${status}`);
    } finally {
      setBusy("");
    }
  };

  const refundPayu = async () => {
    if (!confirm("Process PayU refund for this order?")) return;
    const reason = prompt("Refund reason:") || "Admin refund";
    setBusy("refund");
    try {
      const res = await fetch("/api/admin/payments/payu/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, reason }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Refunded" : "Failed"));
      await fetchOrder();
    } finally {
      setBusy("");
    }
  };

  if (loading) return <p className="p-6">Loading order...</p>;
  if (!order) return <p className="p-6">No order found.</p>;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "N/A";

  const cancelled =
    String(order.status || "").includes("Cancel") ||
    (order.paymentMode === "PayU" && order.paymentStatus !== "Paid");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-gray-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Order #{order._id}</h2>
        <Link href="/admin-dashboard/orders" className="text-sm text-blue-600 underline">
          Back to Orders
        </Link>
      </div>

      <div className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Customer</h3>
        <p>
          <strong>Name:</strong> {order.userId?.name || order.address?.name || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {order.userId?.email || "N/A"}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          {order.userId?.phone || order.address?.phone || "N/A"}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Shipping Address</h3>
        {order.address ? (
          <p>
            {order.address.name}, {order.address.street}, {order.address.city},{" "}
            {order.address.state} - {order.address.pincode}
            {order.address.phone ? ` · ${order.address.phone}` : ""}
          </p>
        ) : (
          <p>N/A</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Payment (PayU / COD)</h3>
        <p>
          <strong>Mode:</strong> {order.paymentMode || "COD"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={`rounded px-2 py-1 text-sm text-white ${
              order.paymentStatus === "Paid" ||
              order.paymentStatus === "Refund Completed"
                ? "bg-green-600"
                : "bg-amber-600"
            }`}
          >
            {order.paymentStatus || "Pending"}
          </span>
        </p>
        {order.payuTxnId && (
          <p className="text-sm">
            <strong>PayU Txn ID:</strong> {order.payuTxnId}
          </p>
        )}
        {order.payuPaymentId && (
          <p className="text-sm">
            <strong>PayU Payment ID (mihpayid):</strong> {order.payuPaymentId}
          </p>
        )}
        {order.refundError && order.paymentStatus === "Refund Pending" && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">
            Refund did not go through: {order.refundError}
          </p>
        )}
        {order.paymentMode === "PayU" &&
          order.payuPaymentId &&
          ["Paid", "Refund Pending"].includes(order.paymentStatus) && (
            <button
              type="button"
              disabled={busy === "refund"}
              onClick={refundPayu}
              className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {busy === "refund"
                ? "Refunding..."
                : order.paymentStatus === "Refund Pending"
                  ? "Retry PayU refund"
                  : "Refund via PayU"}
            </button>
          )}
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Shipping (Shiprocket)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={order.status}
            disabled={busy === "status"}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {!cancelled && !order.awb && !order.shipmentId && (
            <button
              type="button"
              disabled={!!busy}
              onClick={shipViaShiprocket}
              className="rounded bg-[#6f1d1b] px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {busy === "ship" ? "Shipping..." : "Ship via Shiprocket"}
            </button>
          )}
          {!cancelled && order.shipmentId && !order.awb && (
            <button
              type="button"
              disabled={!!busy}
              onClick={generateAwb}
              className="rounded bg-purple-700 px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {busy === "awb" ? "Generating..." : "Generate AWB"}
            </button>
          )}
          {!cancelled && !order.awb && (
            <button
              type="button"
              disabled={!!busy}
              onClick={addManualAwb}
              className="rounded border border-[#6f1d1b] px-3 py-1.5 text-sm text-[#6f1d1b]"
            >
              Add AWB Manually
            </button>
          )}
          {order.awb && (
            <button
              type="button"
              disabled={!!busy}
              onClick={trackAwb}
              className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white"
            >
              {busy === "track" ? "Tracking..." : "Refresh Tracking"}
            </button>
          )}
        </div>

        {(order.awb || order.shipmentId || order.courierName) && (
          <div className="space-y-1 rounded border border-purple-100 bg-purple-50 p-3 text-sm">
            {order.shipmentId && (
              <p>
                <strong>Shipment ID:</strong> {order.shipmentId}
              </p>
            )}
            {order.shiprocketOrderId && (
              <p>
                <strong>SR Order:</strong> {order.shiprocketOrderId}
              </p>
            )}
            {order.courierName && (
              <p>
                <strong>Courier:</strong> {order.courierName}
              </p>
            )}
            {order.awb && (
              <p>
                <strong>AWB:</strong> {order.awb}
              </p>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Open tracking
              </a>
            )}
            {order.labelUrl && (
              <a
                href={order.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-3 text-blue-600 underline"
              >
                Label
              </a>
            )}
          </div>
        )}
        {order.cancelReason && (
          <p className="text-sm text-red-600">Reason: {order.cancelReason}</p>
        )}
      </div>

      <div className="space-y-1 rounded-xl border bg-white p-4 text-sm shadow-sm">
        <p>
          <strong>Placed:</strong> {formatDate(order.createdAt)}
        </p>
        <p>
          <strong>Updated:</strong> {formatDate(order.updatedAt)}
        </p>
        <p>
          <strong>Expected Delivery:</strong> {formatDate(order.expectedDelivery)}
        </p>
      </div>

      {order.statusHistory?.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Status history</h3>
          <ol className="space-y-2 text-sm">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-40 shrink-0 text-gray-500">{formatDate(h.at)}</span>
                <span>
                  <strong>{h.status}</strong>
                  {h.note ? <span className="text-gray-600"> — {h.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-xl font-semibold">Items</h3>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                  className="h-16 w-16 rounded object-cover"
                  alt=""
                />
                <div>
                  <p className="font-medium">
                    {item.name || item.productId?.name}
                  </p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity || 0}</p>
                  <p className="text-sm text-gray-600">
                    ₹{Number(item.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-lg font-bold">
          Total: ₹{Number(order.totalAmount || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
