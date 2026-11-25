"use client";

import { useEffect, useState } from "react";
import { Bell, Trash2, Send, Edit2 } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSent, setShowSent] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
    if (showSent) {
      fetchSentNotifications();
    }
    const interval = setInterval(() => {
      fetchNotifications();
      if (showSent) fetchSentNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [showSent]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications/sent");
      const data = await res.json();
      if (data.success) {
        setSentNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
        alert("Notification deleted successfully");
      } else {
        alert("Error deleting notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Error deleting notification");
    }
  };

  const deleteSentNotification = async (id) => {
    if (!confirm("Are you sure you want to delete this sent notification?")) return;
    
    try {
      const res = await fetch(`/api/admin/notifications/sent/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setSentNotifications(sentNotifications.filter(n => n._id !== id));
        alert("Notification deleted successfully");
      } else {
        const data = await res.json();
        alert(data.message || "Error deleting notification");
      }
    } catch (error) {
      console.error("Error deleting sent notification:", error);
      alert("Error deleting notification");
    }
  };

  const startEdit = (notif) => {
    setEditingId(notif._id);
    setEditTitle(notif.title);
    setEditMessage(notif.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim() || !editMessage.trim()) {
      alert("Title and message are required");
      return;
    }

    try {
      const res = await fetch(`/api/admin/notifications/sent/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          message: editMessage,
        }),
      });

      if (res.ok) {
        setSentNotifications(sentNotifications.map(n => 
          n._id === id ? { ...n, title: editTitle, message: editMessage } : n
        ));
        setEditingId(null);
        alert("Notification updated successfully");
      } else {
        const data = await res.json();
        alert(data.message || "Error updating notification");
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      alert("Error updating notification");
    }
  };

  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h2>
        <button
          onClick={() => setShowSent(!showSent)}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            showSent
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Send className="w-4 h-4" />
          {showSent ? "Hide Sent" : "Show Sent"}
        </button>
      </div>

      {/* Show sent notifications */}
      {showSent ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-4">Notifications Sent to Users</h3>
          {sentNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No sent notifications found
            </div>
          ) : (
            sentNotifications.map((notif) => (
              <div
                key={notif._id}
                className="bg-white border-l-4 border-l-green-500 rounded-lg shadow p-4"
              >
                {editingId === notif._id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Title"
                    />
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="Message"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(notif._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 flex-1">
                      <Send className="w-5 h-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{notif.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          To: {notif.userId?.name || notif.userId?.phone || "User"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(notif)}
                        className="p-2 hover:bg-blue-50 rounded text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSentNotification(notif._id)}
                        className="p-2 hover:bg-red-50 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        // Admin Notifications (Received)
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No notifications found
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className="bg-white border-l-4 border-l-blue-500 rounded-lg shadow p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <Bell className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{notif.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
