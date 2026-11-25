"use client";

import { useEffect, useState } from "react";

export default function DeleteRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // 🔹 Load delete requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/delete-account-requests?status=${activeTab}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch {
      alert("Failed to load delete requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  // 🔹 Update request status
  const updateStatus = async (id, status) => {
    const confirmMsg =
      status === "approved"
        ? "Approve and schedule account deletion?"
        : "Reject delete request?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        "/api/admin/delete-account-requests/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        }
      );

      const data = await res.json();
      if (data.success) loadRequests();
      else alert(data.message || "Action failed");
    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        🗑️ Delete Account Requests
      </h1>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        {["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="text-gray-500">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">
          No {activeTab} delete requests found.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Requested On</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">
                    {r.user?.name || "N/A"}
                  </td>
                  <td className="p-3">
                    {r.user?.phone || "-"}
                  </td>
                  <td className="p-3">
                    {r.reason || "-"}
                  </td>
                  <td className="p-3">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    {activeTab === "pending" ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            updateStatus(r._id, "approved")
                          }
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateStatus(r._id, "rejected")
                          }
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 capitalize">
                        {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
