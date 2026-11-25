import { isPayuConfigured, refundPayuPayment } from "@/lib/payu";
import {
  cancelShiprocketOrder,
  isShiprocketConfigured,
  requestShiprocketPickup,
} from "@/lib/shiprocket";

/** Requests a courier pickup for an order that has an AWB. Does not save. */
export async function schedulePickup(order) {
  if (!order.shipmentId || !order.awb) {
    return { ok: false, message: "Shipment needs an AWB before pickup" };
  }
  try {
    const pickup = await requestShiprocketPickup(order.shipmentId);
    order.pickupRequestedAt = new Date();
    order.pickupScheduledFor = pickup.scheduledDate || "";
    order.pickupError = undefined;
    return { ok: true, scheduledDate: pickup.scheduledDate };
  } catch (err) {
    // Shiprocket answers "already in pickup queue" when a pickup exists; treat that as done
    if (/already|queue/i.test(err.message || "")) {
      order.pickupRequestedAt = order.pickupRequestedAt || new Date();
      order.pickupError = undefined;
      return { ok: true, scheduledDate: order.pickupScheduledFor || null };
    }
    order.pickupError = err.message || "Pickup request failed";
    return { ok: false, message: order.pickupError };
  }
}

/** Sets the order status and appends it to the status history. Does not save. */
export function recordStatus(order, status, note = "") {
  order.status = status;
  if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
  order.statusHistory.push({ status, note, at: new Date() });

  if (status === "Shipped" || status === "Out for Delivery") {
    const eta = new Date();
    eta.setDate(eta.getDate() + (status === "Out for Delivery" ? 1 : 4));
    order.expectedDelivery = eta;
  }
  if (status === "Delivered" || status === "Completed") {
    order.deliveredAt = order.deliveredAt || new Date();
    if (order.paymentMode === "COD") order.paymentStatus = "Paid";
  }
}

/** Sends a PayU refund for a paid order. Does not save. */
export async function refundOrderPayment(order, reason = "") {
  if (order.paymentMode !== "PayU" || !order.payuPaymentId) {
    return { ok: false, skipped: true };
  }
  if (!["Paid", "Refund Pending"].includes(order.paymentStatus)) {
    return { ok: false, skipped: true };
  }
  if (!isPayuConfigured()) {
    order.paymentStatus = "Refund Pending";
    order.refundError = "PayU is not configured";
    return { ok: false, message: order.refundError };
  }

  const refundId = `RF${String(order._id).slice(-8)}${Date.now()}`;
  try {
    await refundPayuPayment({
      mihpayid: order.payuPaymentId,
      amount: order.totalAmount,
      refundId,
    });
    order.paymentStatus = "Refund Initiated";
    order.refundId = refundId;
    order.refundError = undefined;
    return { ok: true };
  } catch (err) {
    order.paymentStatus = "Refund Pending";
    order.refundError = err.message || "PayU refund failed";
    console.error("Order refund:", err.message, reason);
    return { ok: false, message: order.refundError };
  }
}

/**
 * Cancels an order: stops the Shiprocket shipment if one exists, refunds a PayU
 * payment, and records the cancellation. Saves the order.
 */
export async function cancelOrder(order, { by = "admin", reason = "" } = {}) {
  const notes = [];

  if (order.shiprocketOrderId && isShiprocketConfigured()) {
    try {
      await cancelShiprocketOrder(order.shiprocketOrderId);
      notes.push("Shiprocket shipment cancelled");
    } catch (err) {
      notes.push(`Shiprocket cancel failed: ${err.message}`);
    }
  }

  const refund = await refundOrderPayment(order, reason);
  if (refund.ok) notes.push("PayU refund initiated");
  else if (!refund.skipped) notes.push(`Refund pending: ${refund.message}`);

  if (order.paymentMode === "COD" && order.paymentStatus === "Pending") {
    order.paymentStatus = "Not charged";
  }

  order.cancelReason = reason || "No reason provided";
  order.cancelledBy = by;
  recordStatus(order, by === "user" ? "Cancelled by User" : "Cancelled by Admin", reason);
  await order.save();

  return { refund, notes };
}
