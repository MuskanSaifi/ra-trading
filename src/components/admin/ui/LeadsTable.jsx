"use client";

import { Fragment, useMemo, useState } from "react";
import { Download, Mail, MessageCircle, Phone, RefreshCw, Trash2 } from "lucide-react";
import DateRangeFilter from "@/components/admin/ui/DateRangeFilter";
import { EmptyState, PageHeader, SearchInput, TableSkeleton } from "@/components/admin/ui";
import { inRange } from "@/lib/dateRange";
import { formatDate } from "@/lib/orderStatus";

function digits(phone = "") {
  const d = String(phone).replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}

/**
 * Shared list for inbound leads (contact form, chatbot).
 * columns: [{ key, label, render?(row) }]; searchKeys: fields used by the search box.
 */
export default function LeadsTable({
  title,
  description,
  rows,
  loading,
  columns,
  searchKeys,
  phoneKey = "phone",
  emailKey = "email",
  messageKey = "message",
  onRefresh,
  onDelete,
  exportName = "leads",
}) {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ preset: "all" });
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        inRange(r.createdAt, range) &&
        (!q || searchKeys.some((k) => String(r[k] || "").toLowerCase().includes(q)))
    );
  }, [rows, search, range, searchKeys]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [...columns.map((c) => c.label), "Message", "Date"];
    const lines = filtered.map((r) =>
      [...columns.map((c) => r[c.key]), r[messageKey], new Date(r.createdAt).toLocaleString("en-IN")]
        .map(esc)
        .join(",")
    );
    const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!filtered.length}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search…" className="sm:w-96" />
        <DateRangeFilter value={range} onChange={setRange} />
        <p className="text-sm text-slate-500 sm:ml-auto">
          {filtered.length} of {rows.length}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No entries found" description="Try another search or date range." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const open = openId === r._id;
                  const phone = r[phoneKey];
                  const email = r[emailKey];
                  return (
                    <Fragment key={r._id}>
                      <tr
                        onClick={() => setOpenId(open ? null : r._id)}
                        className={`cursor-pointer align-top hover:bg-slate-50/70 ${open ? "bg-slate-50" : ""}`}
                      >
                        {columns.map((c) => (
                          <td key={c.key} className="px-4 py-3 text-slate-800">
                            {c.render ? c.render(r) : r[c.key] || "—"}
                          </td>
                        ))}
                        <td className="max-w-xs px-4 py-3 text-slate-600">
                          <p className={open ? "whitespace-pre-line" : "line-clamp-2"}>{r[messageKey] || "—"}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                          {formatDate(r.createdAt, true)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {phone && (
                              <>
                                <a
                                  href={`tel:${phone}`}
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  aria-label="Call"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                                <a
                                  href={`https://wa.me/${digits(phone)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700"
                                  aria-label="WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </>
                            )}
                            {email && (
                              <a
                                href={`mailto:${email}`}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Email"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onDelete(r)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
