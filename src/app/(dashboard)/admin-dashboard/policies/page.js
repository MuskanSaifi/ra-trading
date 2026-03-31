"use client";

import { useEffect, useMemo, useState } from "react";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

const POLICY_OPTIONS = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", label: "Terms & Conditions" },
  { slug: "refund-and-return-policy", label: "Refund & Return Policy" },
];

export default function AdminPoliciesPage() {
  const [slug, setSlug] = useState(POLICY_OPTIONS[0].slug);
  const [title, setTitle] = useState(POLICY_OPTIONS[0].label);
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editorKey = useMemo(() => `${slug}:${title.length}:${contentHtml.length}`, [slug]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/policies/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        const fallback = POLICY_OPTIONS.find((o) => o.slug === slug)?.label || "Policy";

        if (json?.success && json.page) {
          setTitle(json.page.title || fallback);
          setContentHtml(json.page.contentHtml || "<p></p>");
        } else {
          setTitle(fallback);
          setContentHtml("<p></p>");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/policies/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contentHtml }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Save failed");
      alert("Saved.");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Policies</h1>
          <p className="text-sm text-slate-600">
            Edit the public policy pages shown on your store.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#ff9900] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page
            </span>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {POLICY_OPTIONS.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Page title"
            />
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <div>
            <BlogRichEditor
              key={editorKey}
              initialContent={contentHtml || "<p></p>"}
              onChange={setContentHtml}
            />
          </div>
        )}
      </div>
    </div>
  );
}

