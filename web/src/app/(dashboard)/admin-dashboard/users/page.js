"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Trash2 } from "lucide-react";
import DateRangeFilter from "@/components/admin/ui/DateRangeFilter";
import { EmptyState, PageHeader, Pagination, SearchInput, TableSkeleton } from "@/components/admin/ui";
import { rangeQuery } from "@/lib/dateRange";
import { formatDate, formatInr } from "@/lib/orderStatus";

const PAGE_SIZE = 15;
const PROFILE_FIELDS = ["name", "email", "phone", "gender", "address", "dob"];

function profileCompletion(u) {
  const filled = PROFILE_FIELDS.filter((f) => u?.[f]).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function Avatar({ user }) {
  if (user.profilePic?.url) {
    return (
      <Image
        src={user.profilePic.url}
        width={36}
        height={36}
        alt=""
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
      />
    );
  }
  const initials = (user.name || user.phone || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--store-primary)]/10 text-xs font-bold text-[var(--store-primary)]">
      {initials}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [range, setRange] = useState({ preset: "all" });
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced, range, sort]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(rangeQuery(range));
      qs.set("page", String(page));
      qs.set("limit", String(PAGE_SIZE));
      if (debounced) qs.set("search", debounced);
      if (sort === "name") qs.set("sort", "name");
      const res = await fetch(`/api/admin/users?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debounced, range, sort, page]);

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name || u.phone}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?id=${u._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchUsers();
    else alert(data.message);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Customers" description="Everyone who has signed up on the store." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone or email" className="lg:w-96" />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm"
          >
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
          </select>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No customers found" description="Try a different search or date range." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Profile</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const pct = profileCompletion(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} />
                          <div>
                            <p className="font-medium text-slate-900">{u.name || "Unnamed"}</p>
                            <p className="text-xs text-slate-500">{u.city || u.accountType || "Regular"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{u.phone || "—"}</p>
                        <p className="text-xs text-slate-500">{u.email || "No email"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{u.orderCount}</p>
                        <p className="text-xs text-slate-500">{u.orderCount ? formatInr(u.totalSpent) : "No orders"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex w-28 items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 80 ? "bg-green-600" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin-dashboard/users/${u._id}/view`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin-dashboard/users/${u._id}/edit`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / PAGE_SIZE)}
        total={total}
        onChange={setPage}
        label="customers"
      />
    </div>
  );
}
