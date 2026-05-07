"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/clientApiError";

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    question: "",
    answer: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFaqs = async () => {
    const res = await fetch("/api/admin/faq");
    const data = await res.json();
    if (data.success) setFaqs(data.faqs);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const url = editing
      ? `/api/admin/faq/${editing._id}`
      : `/api/admin/faq`;

    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Failed to save FAQ.");
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setOpen(false);
        resetForm();
        fetchFaqs();
      } else {
        alert(`❌ ${data.error || data.message || "Failed to save FAQ."}`);
      }
    } catch (error) {
      alert("⚠️ Network error while saving FAQ.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ question: "", answer: "" });
  };

  const handleEdit = (faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this FAQ?")) return;

    const res = await fetch(`/api/admin/faq/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) fetchFaqs();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">FAQ Manager</h1>

        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add FAQ
        </button>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Question</th>
              <th className="p-2 border">Answer</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {faqs.map((faq) => (
              <tr key={faq._id}>
                <td className="p-2 border">{faq.question}</td>
                <td className="p-2 border">{faq.answer}</td>
                <td className="p-2 border">
                  <button
                    className="px-2 py-1 bg-green-600 text-white rounded mr-2"
                    onClick={() => handleEdit(faq)}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(faq._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {faqs.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-4">
                  No FAQs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50">
          <div className="bg-white p-6 rounded w-[450px] shadow-lg">
            <h2 className="text-xl mb-3 font-semibold">
              {editing ? "Edit FAQ" : "Add FAQ"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="question"
                placeholder="Question"
                className="w-full border p-2 rounded"
                value={form.question}
                onChange={handleChange}
                required
              />

              <textarea
                name="answer"
                rows="3"
                placeholder="Answer"
                className="w-full border p-2 rounded"
                value={form.answer}
                onChange={handleChange}
                required
              ></textarea>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {submitting ? "Saving..." : editing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 