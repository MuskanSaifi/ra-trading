"use client";

import { useEffect, useState } from "react";
import LeadsTable from "@/components/admin/ui/LeadsTable";

const COLUMNS = [
  { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name || "—"}</span> },
  {
    key: "phone",
    label: "Contact",
    render: (r) => (
      <>
        <p>{r.phone || "—"}</p>
        <p className="text-xs text-slate-500">{r.email}</p>
      </>
    ),
  },
  { key: "subject", label: "Subject" },
];

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact-form", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const deleteMessage = async (msg) => {
    if (!confirm(`Delete the message from ${msg.name || msg.phone}?`)) return;
    const res = await fetch(`/api/admin/contact-form?id=${msg._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    else alert("Failed to delete message");
  };

  return (
    <LeadsTable
      title="Contact messages"
      description="Enquiries sent from the website contact form. Click a row to read the full message."
      rows={messages}
      loading={loading}
      columns={COLUMNS}
      searchKeys={["name", "email", "phone", "subject", "message"]}
      onRefresh={fetchMessages}
      onDelete={deleteMessage}
      exportName="contact-messages"
    />
  );
}
