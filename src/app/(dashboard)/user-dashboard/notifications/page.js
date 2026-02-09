'use client';

import { useEffect, useState } from "react";

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user?._id) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/user/notifications?userId=${user._id}`);
      const data = await res.json();

      if (data.success) {
        const sorted = (data.notifications || []).sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setNotifications(sorted);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    const notif = notifications.find((n) => n._id === id);
    if (!notif || notif.isRead) return;

    try {
      await fetch(`/api/user/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Mark read error:", err);
    } finally {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
    if (!unreadIds.length) return;

    try {
      setMarkingAll(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user?._id) return;

      await fetch(
        `/api/user/notifications/mark-all-read?userId=${user._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setMarkingAll(false);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <p className="p-6">Loading notifications...</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`border rounded-lg p-4 bg-white shadow-sm flex justify-between items-start ${
                n.isRead ? "opacity-70" : ""
              }`}
            >
              <div>
                <p className="font-semibold">{n.title || "Notification"}</p>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n._id)}
                  className="text-xs px-3 py-1 rounded-full border border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



