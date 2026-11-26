"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, Users, Search, CheckCircle2, Bell } from "lucide-react";
import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { getApiErrorMessage } from "@/lib/clientApiError";

export default function SendNotificationPage() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    actionUrl: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Pull a large page so admin can broadcast; server caps at 100
      const res = await fetch("/api/admin/users?limit=100&sort=name", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
      else setStatus({ ok: false, text: data.message || "Could not load users" });
    } catch (error) {
      console.error("Error fetching users:", error);
      setStatus({ ok: false, text: "Network error while loading users" });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.name || ""} ${u.phone || ""} ${u.email || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => selectedUsers.includes(u._id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const drop = new Set(filtered.map((u) => u._id));
      setSelectedUsers((prev) => prev.filter((id) => !drop.has(id)));
    } else {
      setSelectedUsers((prev) => {
        const set = new Set(prev);
        filtered.forEach((u) => set.add(u._id));
        return [...set];
      });
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.title.trim() || !formData.message.trim()) {
      setStatus({ ok: false, text: "Title and message are required" });
      return;
    }
    if (selectedUsers.length === 0) {
      setStatus({ ok: false, text: "Select at least one customer" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/send-to-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers,
          ...formData,
          title: formData.title.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Failed to send notification.");
        setStatus({ ok: false, text: message });
        return;
      }

      const data = await res.json();
      if (data.success) {
        const pushNote = data.push?.devices
          ? ` · Push sent to ${data.push.devices} device(s)`
          : " · Saved for app/website inbox";
        setStatus({
          ok: true,
          text: `Sent to ${data.notifications?.length || selectedUsers.length} customer(s)${pushNote}`,
        });
        setFormData({
          title: "",
          message: "",
          type: "info",
          priority: "medium",
          actionUrl: "",
        });
        setSelectedUsers([]);
      } else {
        setStatus({ ok: false, text: data.message || data.error || "Failed to send" });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setStatus({ ok: false, text: "Network error while sending notification" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Send notification"
        description="Broadcast to customers. They see it in the app inbox and as a phone system notification (tray). Customer must be logged in on the app and have allowed notifications."
        actions={
          <Link
            href="/admin-dashboard/notifications"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
            Inbox
          </Link>
        }
      />

      {status ? (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            status.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {status.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
          <p>{status.text}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
        <Card className="space-y-4 lg:col-span-3">
          <h3 className="text-base font-semibold text-slate-900">Message</h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--store-primary,#6b2326)] focus:ring-2 focus:ring-[var(--store-primary,#6b2326)]/20"
              placeholder="e.g. Festival sale starts tomorrow"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--store-primary,#6b2326)] focus:ring-2 focus:ring-[var(--store-primary,#6b2326)]/20"
              rows={5}
              placeholder="Write a short clear message for your customers…"
              maxLength={1000}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="info">Info</option>
                <option value="order">Order</option>
                <option value="product">Product</option>
                <option value="system">System</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Deep link (optional)
            </label>
            <input
              type="text"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="/shop or /orders"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used on the website; the app opens the Notifications screen / related order when available.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || selectedUsers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--store-primary,#6b2326)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading
              ? "Sending…"
              : `Send to ${selectedUsers.length || 0} customer${selectedUsers.length === 1 ? "" : "s"}`}
          </button>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Users className="h-4 w-4" />
              Customers
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {selectedUsers.length} selected
              </span>
            </h3>
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="text-xs font-semibold text-[var(--store-primary,#6b2326)] hover:underline"
              disabled={!filtered.length}
            >
              {allFilteredSelected ? "Clear list" : "Select list"}
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--store-primary,#6b2326)]"
            />
          </div>

          <div className="max-h-[28rem] flex-1 overflow-y-auto rounded-lg border border-slate-200">
            {loadingUsers ? (
              <p className="p-4 text-center text-sm text-slate-500">Loading customers…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No customers found</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((user) => {
                  const checked = selectedUsers.includes(user._id);
                  return (
                    <li key={user._id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleUserToggle(user._id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {user.name || "No name"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user.phone || user.email || "—"}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Showing up to 100 latest customers. Use search to find someone quickly.
          </p>
        </Card>
      </form>
    </div>
  );
}
