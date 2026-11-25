"use client";

import { useEffect, useState } from "react";
import LeadsTable from "@/components/admin/ui/LeadsTable";

const COLUMNS = [
  {
    key: "name",
    label: "Lead",
    render: (r) => (
      <>
        <p className="font-medium">{r.name || "—"}</p>
        <p className="text-xs text-slate-500">{r.mobile || "No number"}</p>
      </>
    ),
  },
  {
    key: "userType",
    label: "Type",
    render: (r) =>
      r.userType ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{r.userType}</span>
      ) : (
        "—"
      ),
  },
  {
    key: "productInterest",
    label: "Interest",
    render: (r) => (
      <>
        <p>{r.productInterest || "—"}</p>
        <p className="text-xs text-slate-500">{r.quantity}</p>
      </>
    ),
  },
  { key: "pagePath", label: "Page", render: (r) => <span className="text-xs text-slate-500">{r.pagePath || "—"}</span> },
];

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const removeLead = async (lead) => {
    if (!confirm(`Delete the lead from ${lead.name || lead.mobile}?`)) return;
    const res = await fetch(`/api/admin/chatbot-leads?id=${lead._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data?.success) setLeads((prev) => prev.filter((item) => item._id !== lead._id));
  };

  return (
    <LeadsTable
      title="Chatbot leads"
      description="Wholesale enquiries captured by the website assistant."
      rows={leads}
      loading={loading}
      columns={COLUMNS}
      searchKeys={["name", "mobile", "userType", "productInterest", "quantity", "message", "pagePath"]}
      phoneKey="mobile"
      emailKey="email"
      onRefresh={fetchLeads}
      onDelete={removeLead}
      exportName="chatbot-leads"
    />
  );
}
