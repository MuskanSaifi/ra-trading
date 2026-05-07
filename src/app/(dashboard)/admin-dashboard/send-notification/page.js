"use client";

import { useState, useEffect } from "react";
import { Send, Users, User, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/clientApiError";

export default function SendNotificationPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    actionUrl: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
    setSelectAll(!selectAll);
  };

  const handleUserToggle = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      alert("Title and message are required");
      return;
    }
    
    if (selectedUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/send-to-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers,
          ...formData,
        }),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(
          res,
          "Failed to send notification."
        );
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();
      
      if (data.success) {
        alert(`Notification sent to ${data.notifications.length} user(s) successfully!`);
        // Reset form
        setFormData({
          title: "",
          message: "",
          type: "info",
          priority: "medium",
          actionUrl: "",
        });
        setSelectedUsers([]);
        setSelectAll(false);
      } else {
        alert(`❌ ${data.message || data.error || "Failed to send notification"}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("⚠️ Network error while sending notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Send className="w-6 h-6" />
        Send Notification to Users
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Notification Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="4"
                placeholder="Enter notification message"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="info">Info</option>
                  <option value="order">Order</option>
                  <option value="product">Product</option>
                  <option value="system">System</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Action URL (Optional)</label>
              <input
                type="text"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="/user-dashboard/orders"
              />
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Users ({selectedUsers.length} selected)
            </h3>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              {selectAll ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No users found</div>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserToggle(user._id)}
                      className="w-4 h-4"
                    />
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{user.name || "No Name"}</p>
                      <p className="text-sm text-gray-500">{user.phone || user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending..." : `Send to ${selectedUsers.length} User(s)`}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
