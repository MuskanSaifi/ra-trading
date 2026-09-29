"use client";

import { useEffect, useState } from "react";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-orange-100 text-orange-700",
  Packed: "bg-indigo-100 text-indigo-700",
  Shipped: "bg-purple-100 text-purple-700",
  "Out for Delivery": "bg-teal-100 text-teal-700",
  Delivered: "bg-green-100 text-green-700",
  Completed: "bg-green-200 text-green-700",

  "Cancelled by User": "bg-red-200 text-red-700",
  "Cancelled by Admin": "bg-red-200 text-red-700",

  "Return Requested": "bg-yellow-200 text-yellow-700",
  "Return Approved": "bg-blue-200 text-blue-700",
  "Return Rejected": "bg-red-300 text-red-800",
  "Refund Initiated": "bg-purple-200 text-purple-700",
  "Refund Completed": "bg-green-300 text-green-700",
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = () => {
    const localUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!localUser) {
      setLoading(false);
      return;
    }
    fetch(`/api/user/order/user-orders?userId=${localUser._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrders(data.orders || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // *** OPEN CANCEL MODAL ***
  const openCancelModal = (orderId) => {
    setSelectedOrder(orderId);
    setCancelReason("");
    setCancelModal(true);
  };

  // *** CONFIRM CANCEL WITH REASON ***
  const confirmCancellation = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter a cancellation reason.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    const res = await fetch(`/api/user/order/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: selectedOrder,
        userId: user._id,
        reason: cancelReason,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Order Cancelled Successfully");
      setCancelModal(false);
      fetchOrders();
    } else {
      alert(data.message || "Failed to cancel order");
    }
  };

  if (loading) return <p className="p-6">Loading orders...</p>;
  if (!orders.length) return <p className="p-6">No orders yet.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.map(order => (
        <div key={order._id} className="border p-4 rounded-lg shadow bg-white space-y-3">

          {/* ORDER ID */}
          <p className="font-semibold text-blue-600">Order #{order._id.slice(-6)}</p>

          {/* STATUS BADGE */}
          <div className="flex gap-2 items-center">
            <p><strong>Status:</strong></p>
            <span className={`px-3 py-1 rounded text-sm ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
          </div>

          {/* Expected Delivery */}
          {order.expectedDelivery && (
            <p className="text-sm text-gray-700">
              ðŸ“¦ Expected Delivery:{" "}
              <strong>{new Date(order.expectedDelivery).toDateString()}</strong>
            </p>
          )}

          {/* Cancel Reason shown */}
          {order.cancelReason && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              â— <strong>Cancel Reason:</strong> {order.cancelReason}
            </p>
          )}

          {/* TOTAL */}
          <p className="font-bold text-lg text-purple-700">
            Total: â‚¹{Number(order.totalAmount).toLocaleString()}
          </p>

          {/* Cancel Button */}
          {order.status === "Pending" ? (
            <button
              onClick={() => openCancelModal(order._id)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Cancel Order
            </button>
          ) : (
            <button className="bg-gray-300 text-gray-600 px-3 py-1 rounded cursor-not-allowed">
              Cannot Cancel
            </button>
          )}

          {/* Items */}
          <div className="mt-2 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 border-b py-2">
                <img
                  src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                  className="w-14 h-14 object-cover rounded border"
                />

                <div>
                  <p className="font-medium">{item.productId?.name || item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  <p className="text-sm text-gray-600">
                    Price: â‚¹{Number(item.price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* CANCEL MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[400px] space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">Cancellation Reason</h2>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="border w-full p-2 rounded h-28"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModal(false)}
                className="px-4 py-1 rounded border"
              >
                Close
              </button>

              <button
                onClick={confirmCancellation}
                className="px-4 py-1 rounded bg-red-600 text-white"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
