// /src/app/track/page.js
"use client";

import { useState } from "react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrackOrder = async () => {
    if (!orderId) {
      setError("Please enter your Order ID");
      setStatus(null);
      return;
    }

    setLoading(true);
    setError("");
    setStatus(null);

    try {
      // Simulated API call (replace with real backend)
      const res = await fetch(`/api/track-order?orderId=${orderId}`);
      const data = await res.json();

      if (data.success) {
        setStatus(data.status);
      } else {
        setError("Order not found. Please check your Order ID.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Track Your Order
        </h1>
        <p className="text-center text-gray-600 mb-4">
          Enter your Order ID to see the current status of your order.
        </p>

        <input
          type="text"
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <button
          onClick={handleTrackOrder}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? "Tracking..." : "Track Order"}
        </button>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

        {status && (
          <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">
            Order Status: {status}
          </div>
        )}
      </div>
    </div>
  );
}