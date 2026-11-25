"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DATE_PRESETS, rangeLabel } from "@/lib/dateRange";

/**
 * value: { preset, from?, to? } where from/to are YYYY-MM-DD for custom ranges.
 */
export default function DateRangeFilter({ value, onChange, presets = DATE_PRESETS }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: value?.from || "", to: value?.to || "" });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const quick = presets.filter((p) => p.key !== "custom");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <CalendarDays className="h-4 w-4 text-slate-500" />
        {rangeLabel(value)}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5">
            {quick.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onChange({ preset: p.key });
                  setOpen(false);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  value?.preset === p.key
                    ? "bg-[var(--store-primary)] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">
                From
                <input
                  type="date"
                  max={draft.to || today}
                  value={draft.from}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-slate-600">
                To
                <input
                  type="date"
                  min={draft.from || undefined}
                  max={today}
                  value={draft.to}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={!draft.from && !draft.to}
              onClick={() => {
                onChange({ preset: "custom", from: draft.from, to: draft.to || draft.from });
                setOpen(false);
              }}
              className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
