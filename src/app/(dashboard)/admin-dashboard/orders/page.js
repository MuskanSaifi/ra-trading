"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Completed",
  "Cancelled by Admin",
  "Return Requested",
  "Return Approved",
  "Return Rejected",
  "Refund Initiated",
  "Refund Completed"
];

export default function AdminUserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingId, setShippingId] = useState(null);
  const [awbBusyId, setAwbBusyId] = useState(null);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/admin-orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Orders Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    let cancelReason = "";

    if (newStatus === "Cancelled by Admin") {
      cancelReason = prompt("Please enter cancellation reason:");
      if (!cancelReason || !cancelReason.trim()) {
        alert("Cancellation reason is required.");
        return;
      }
    }

    try {
      await fetch("/api/admin/admin-orders/update-order-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, cancelReason })
      });

      fetchOrders();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const shipViaShiprocket = async (orderId) => {
    if (!confirm("Create Shiprocket shipment + AWB for this order?")) return;
    setShippingId(orderId);
    try {
      const res = await fetch("/api/admin/shiprocket/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Shiprocket shipment failed");
        return;
      }
      alert(
        data.order?.awb || data.shipment?.awb
          ? `Shipped! AWB: ${data.order?.awb || data.shipment?.awb}`
          : "Shipment created — AWB pending. Click Generate AWB."
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Shiprocket request failed");
    } finally {
      setShippingId(null);
    }
  };

  const generateAwb = async (orderId) => {
    setAwbBusyId(orderId);
    try {
      const res = await fetch("/api/admin/shiprocket/assign-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "AWB generate failed");
        return;
      }
      alert(`AWB generated: ${data.shipment?.awb || data.order?.awb}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("AWB request failed");
    } finally {
      setAwbBusyId(null);
    }
  };

  const addManualAwb = async (orderId) => {
    const awb = prompt("Enter AWB / tracking number:");
    if (!awb || !awb.trim()) return;
    const courierName = prompt("Courier name (optional):") || "";

    setAwbBusyId(orderId);
    try {
      const res = await fetch("/api/admin/shiprocket/assign-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          awb: awb.trim(),
          courierName: courierName.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to save AWB");
        return;
      }
      alert(`AWB saved: ${data.order?.awb}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to save AWB");
    } finally {
      setAwbBusyId(null);
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (!orders.length) return <p>No orders found.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">All Orders</h2>

      <div className="space-y-6">
        {orders.map(order => (
          <div key={order._id} className="border p-5 rounded-xl bg-white shadow space-y-4">

            <div className="flex justify-between items-center">
              <p
                className="font-semibold text-blue-600 cursor-pointer hover:underline"
                onClick={() => router.push(`/admin-dashboard/orders/${order._id}`)}
              >
                Order ID: #{order._id}
              </p>

              <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="font-semibold">{order.address?.name} ({order.address?.phone})</p>
              <p className="text-sm text-gray-700">
                {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold">Status:</p>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order._id, e.target.value)}
                className="border px-3 py-1 rounded text-sm"
              >
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {!order.awb && !String(order.status || "").includes("Cancel") && (
                <>
                  {!order.shipmentId && (
                    <button
                      type="button"
                      onClick={() => shipViaShiprocket(order._id)}
                      disabled={shippingId === order._id}
                      className="rounded bg-[#6f1d1b] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {shippingId === order._id ? "Creating..." : "Ship via Shiprocket"}
                    </button>
                  )}

                  {order.shipmentId && (
                    <button
                      type="button"
                      onClick={() => generateAwb(order._id)}
                      disabled={awbBusyId === order._id}
                      className="rounded bg-purple-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {awbBusyId === order._id ? "Generating..." : "Generate AWB"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => addManualAwb(order._id)}
                    disabled={awbBusyId === order._id}
                    className="rounded border border-[#6f1d1b] px-3 py-1.5 text-sm font-medium text-[#6f1d1b] disabled:opacity-60"
                  >
                    Add AWB Manually
                  </button>
                </>
              )}

              {order.awb && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(
                      `/api/admin/shiprocket/track?orderId=${order._id}`
                    );
                    const data = await res.json();
                    if (!data.success) return alert(data.message || "Track failed");
                    const st =
                      data.tracking?.tracking_data?.shipment_status ||
                      data.tracking?.shipment_status ||
                      "OK";
                    alert(`Tracking: ${st}`);
                  }}
                  className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Track AWB
                </button>
              )}
            </div>

            {(order.awb || order.trackingUrl || order.courierName || order.shipmentId) && (
              <div className="rounded border border-purple-100 bg-purple-50 p-3 text-sm space-y-1">
                {order.shipmentId && !order.awb && (
                  <p className="text-amber-700">Shipment created — AWB pending</p>
                )}
                {order.courierName && <p><strong>Courier:</strong> {order.courierName}</p>}
                {order.awb && <p><strong>AWB:</strong> {order.awb}</p>}
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    Track shipment
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
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Reason: <strong>{order.cancelReason}</strong>
              </p>
            )}

            <p className="font-bold text-lg text-purple-700">
              Total: ₹{Number(order.totalAmount).toLocaleString()}
              <span className="ml-2 text-sm font-medium text-gray-600">
                ({order.paymentMode || "COD"} / {order.paymentStatus || "Pending"})
              </span>
            </p>

            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b pb-3">
                  <div className="flex gap-3 items-center">
                    <img
                      src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                      className="w-14 h-14 rounded border"
                      alt=""
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm">Qty: {item.quantity}</p>
                      <p className="text-sm">₹{item.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
