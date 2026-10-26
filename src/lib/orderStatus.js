// Shared between server routes and client pages: keep this file free of server-only imports.

export const ORDER_FIELDS_FOR_CUSTOMER =
  "items address totalAmount paymentMode paymentStatus status statusHistory cancelReason expectedDelivery deliveredAt createdAt awb courierName trackingUrl shippedAt";

export const TRACKING_STEPS = [
  { key: "placed", label: "Order placed", statuses: ["Pending"] },
  { key: "confirmed", label: "Confirmed", statuses: ["Confirmed", "Processing"] },
  { key: "packed", label: "Packed", statuses: ["Packed"] },
  { key: "shipped", label: "Shipped", statuses: ["Shipped"] },
  { key: "out", label: "Out for delivery", statuses: ["Out for Delivery"] },
  { key: "delivered", label: "Delivered", statuses: ["Delivered", "Completed"] },
];

/** Statuses before dispatch, where a customer may still cancel. */
export const CANCELLABLE_STATUSES = ["Pending", "Confirmed", "Processing", "Packed"];

export function isCancelled(status = "") {
  return String(status).startsWith("Cancelled");
}

export function isPaymentIncomplete(order) {
  return order?.status === "Payment Pending" || order?.status === "Payment Failed";
}

export function isReturnFlow(status = "") {
  return String(status).startsWith("Return") || String(status).startsWith("Refund");
}

export function canCustomerCancel(order) {
  return CANCELLABLE_STATUSES.includes(order?.status);
}

/** Index in TRACKING_STEPS for an order status, or -1 when it is off the normal path. */
export function trackingStepIndex(status) {
  return TRACKING_STEPS.findIndex((step) => step.statuses.includes(status));
}

/** First time each tracking step was reached, from the order's status history. */
export function stepDates(order) {
  const dates = {};
  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
  for (const entry of history) {
    const idx = trackingStepIndex(entry.status);
    if (idx >= 0 && !dates[idx]) dates[idx] = entry.at;
  }
  if (!dates[0] && order?.createdAt && !isPaymentIncomplete(order)) {
    dates[0] = order.createdAt;
  }
  return dates;
}

export function statusLabel(status) {
  if (status === "Pending") return "Order placed";
  if (status === "Completed") return "Delivered";
  return status || "Order placed";
}

export function statusTone(status = "") {
  if (status === "Delivered" || status === "Completed" || status === "Refund Completed")
    return "green";
  if (isCancelled(status) || status === "Payment Failed" || status === "Return Rejected")
    return "red";
  if (status === "Shipped" || status === "Out for Delivery") return "blue";
  if (status === "Payment Pending" || isReturnFlow(status)) return "amber";
  return "slate";
}

export function formatInr(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value, withTime = false) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/** One-line headline for the customer, e.g. "Arriving by Sat, 31 Oct". */
export function deliveryHeadline(order) {
  const status = order?.status;
  const day = (d) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  if (status === "Delivered" || status === "Completed") {
    return order.deliveredAt ? `Delivered on ${day(order.deliveredAt)}` : "Delivered";
  }
  if (isCancelled(status)) return "Cancelled";
  if (status === "Payment Failed") return "Payment failed";
  if (status === "Payment Pending") return "Waiting for payment";
  if (isReturnFlow(status)) return statusLabel(status);
  if (status === "Out for Delivery") return "Out for delivery today";
  if (order?.expectedDelivery) return `Arriving by ${day(order.expectedDelivery)}`;
  return statusLabel(status);
}

export const TONE_CLASSES = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
};
