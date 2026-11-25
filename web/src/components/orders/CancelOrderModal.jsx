"use client";

import { useState } from "react";
import { X } from "lucide-react";

const REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time is too long",
  "Need to change the address or items",
  "No longer needed",
];

export default function CancelOrderModal({ order, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  if (!order) return null;

  const finalReason = reason === "Other" ? other.trim() : reason;
  const paidOnline = order.paymentMode === "PayU" && order.paymentStatus === "Paid";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cancel this order?</h2>
            <p className="text-xs text-slate-500">Order #{String(order._id).slice(-8).toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {paidOnline
            ? "Your payment will be refunded to the original payment method. Refunds usually take 5–7 business days."
            : "This is a cash on delivery order, so nothing has been charged."}
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="mb-1 text-sm font-semibold text-slate-800">Reason for cancellation</legend>
          {[...REASONS, "Other"].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="cancel-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-[var(--store-primary)]"
              />
              {r}
            </label>
          ))}
          {reason === "Other" && (
            <textarea
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Tell us more"
              className="mt-1 h-20 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-[var(--store-primary)]"
            />
          )}
        </fieldset>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Keep order
          </button>
          <button
            type="button"
            disabled={!finalReason || busy}
            onClick={() => onConfirm(finalReason)}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Cancelling..." : "Cancel order"}
          </button>
        </div>
      </div>
    </div>
  );
}
