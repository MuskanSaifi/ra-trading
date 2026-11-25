"use client";

import { Check } from "lucide-react";
import {
  TRACKING_STEPS,
  formatDate,
  isCancelled,
  isPaymentIncomplete,
  isReturnFlow,
  stepDates,
  trackingStepIndex,
} from "@/lib/orderStatus";

export default function OrderTracker({ order, compact = false }) {
  if (!order) return null;

  if (isCancelled(order.status) || isPaymentIncomplete(order) || isReturnFlow(order.status)) {
    return null;
  }

  const current = trackingStepIndex(order.status);
  const dates = stepDates(order);
  const progress = current <= 0 ? 0 : (current / (TRACKING_STEPS.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Desktop / tablet: horizontal */}
      <div className="relative hidden sm:block">
        <div className="absolute left-[8%] right-[8%] top-4 h-1 rounded-full bg-slate-200">
          <div
            className="h-1 rounded-full bg-green-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="relative grid grid-cols-6">
          {TRACKING_STEPS.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step.key} className="flex flex-col items-center text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    done
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  } ${i === current ? "ring-4 ring-green-600/20" : ""}`}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`mt-2 text-xs font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}
                >
                  {step.label}
                </span>
                {!compact && dates[i] && (
                  <span className="mt-0.5 text-[11px] text-slate-500">{formatDate(dates[i])}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile: vertical */}
      <ol className="space-y-0 sm:hidden">
        {TRACKING_STEPS.map((step, i) => {
          const done = i <= current;
          const last = i === TRACKING_STEPS.length - 1;
          if (compact && i > current + 1) return null;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    done ? "border-green-600 bg-green-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {done && <Check size={12} strokeWidth={3} />}
                </span>
                {!last && (
                  <span className={`w-0.5 flex-1 min-h-5 ${i < current ? "bg-green-600" : "bg-slate-200"}`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-sm font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>
                {dates[i] && <p className="text-xs text-slate-500">{formatDate(dates[i], true)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
