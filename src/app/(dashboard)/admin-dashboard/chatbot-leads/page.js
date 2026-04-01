"use client";

import { useEffect, useState } from "react";

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chatbot-leads", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) setLeads(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const removeLead = async (id) => {
    if (!confirm("Delete this lead?")) return;
    const res = await fetch(`/api/admin/chatbot-leads?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data?.success) {
      setLeads((prev) => prev.filter((item) => item._id !== id));
    }
  };

  const filtered = leads.filter((lead) => {
    const q = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(q) ||
      lead.mobile?.includes(q) ||
      lead.userType?.toLowerCase().includes(q) ||
      lead.productInterest?.toLowerCase().includes(q) ||
      lead.quantity?.toLowerCase().includes(q) ||
      lead.message?.toLowerCase().includes(q) ||
      lead.pagePath?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Chatbot Leads</h1>
        <button
          onClick={fetchLeads}
          className="bg-[var(--store-primary)] text-[var(--store-ink)] px-4 py-2 rounded-lg font-semibold hover:brightness-95"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, phone or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-lg p-2"
        />
      </div>

      {loading ? (
        <p className="text-gray-700">Loading leads...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No chatbot submissions found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Mobile</th>
                <th className="text-left py-3 px-4">User Type</th>
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Quantity</th>
                <th className="text-left py-3 px-4">Message</th>
                <th className="text-left py-3 px-4">Page</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead._id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-2 px-4">{lead.name}</td>
                  <td className="py-2 px-4">{lead.mobile || "-"}</td>
                  <td className="py-2 px-4 text-sm">{lead.userType || "-"}</td>
                  <td className="py-2 px-4 text-sm">{lead.productInterest || "-"}</td>
                  <td className="py-2 px-4 text-sm">{lead.quantity || "-"}</td>
                  <td className="py-2 px-4 text-gray-700 max-w-sm">
                    {lead.message?.length > 90
                      ? `${lead.message.slice(0, 90)}...`
                      : lead.message}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-500">{lead.pagePath || "-"}</td>
                  <td className="py-2 px-4 text-sm text-gray-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => removeLead(lead._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
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

