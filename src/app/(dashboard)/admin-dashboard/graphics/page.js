"use client";

import { useEffect, useMemo, useState } from "react";

const LAYOUTS = [
  { value: "strip", label: "Strip (horizontal scroll)" },
  { value: "grid", label: "Grid" },
  { value: "carousel", label: "Carousel (large cards)" },
];

function emptyItem() {
  return { title: "", href: "", image: null, imageUrl: "" };
}

export default function GraphicsAdminPage() {
  const [blocks, setBlocks] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    enabled: true,
    order: 0,
    layout: "strip",
    title: "",
    subtitle: "",
    items: [emptyItem(), emptyItem(), emptyItem()],
  });

  const fetchBlocks = async () => {
    const res = await fetch("/api/admin/graphics");
    const data = await res.json();
    setBlocks(Array.isArray(data?.blocks) ? data.blocks : []);
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const resetForm = () => {
    setForm({
      _id: null,
      enabled: true,
      order: 0,
      layout: "strip",
      title: "",
      subtitle: "",
      items: [emptyItem(), emptyItem(), emptyItem()],
    });
  };

  const canSave = useMemo(() => {
    const hasAtLeastOne = form.items.some((it) => it.image || it.imageUrl);
    return !!form.layout && hasAtLeastOne;
  }, [form]);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);

    const payload = {
      _id: form._id,
      enabled: !!form.enabled,
      order: Number(form.order) || 0,
      layout: form.layout,
      title: form.title,
      subtitle: form.subtitle,
      items: form.items.map((it) => ({
        title: it.title,
        href: it.href,
        image: { url: it.imageUrl || "" },
      })),
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));
    form.items.forEach((it, idx) => {
      if (it.image) fd.append(`image_${idx}`, it.image);
    });

    const endpoint = form._id ? `/api/admin/graphics/${form._id}` : "/api/admin/graphics";
    const res = await fetch(endpoint, { method: form._id ? "PUT" : "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json?.error || `Save failed (${res.status})`);
      setSaving(false);
      return;
    }

    setOpen(false);
    resetForm();
    await fetchBlocks();
    setSaving(false);
  };

  const editBlock = (b) => {
    setForm({
      _id: b._id,
      enabled: b.enabled !== false,
      order: b.order || 0,
      layout: b.layout || "strip",
      title: b.title || "",
      subtitle: b.subtitle || "",
      items: (Array.isArray(b.items) ? b.items : []).map((it) => ({
        title: it?.title || "",
        href: it?.href || "",
        image: null,
        imageUrl: it?.image?.url || "",
      })).concat([emptyItem(), emptyItem()]).slice(0, 8),
    });
    setOpen(true);
  };

  const deleteBlock = async (id) => {
    if (!confirm("Delete this graphics block?")) return;
    await fetch(`/api/admin/graphics/${id}`, { method: "DELETE" });
    fetchBlocks();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Home Graphics</h1>
          <p className="text-sm text-slate-600 mt-1">
            Add Nykaa-style graphic strips, grids, and sliders on the homepage.
          </p>
        </div>
        <button
          type="button"
          className="bg-[var(--store-primary)] hover:bg-[var(--store-primary-dark)] text-white px-5 py-2 rounded-lg transition"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          + Add graphics block
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4 shadow-xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-semibold">{form._id ? "Edit block" : "Add block"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Enabled
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={!!form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  />{" "}
                  <span className="text-sm text-slate-700">Show on homepage</span>
                </div>
              </label>

              <label className="text-sm font-medium">
                Order (higher shows first)
                <input
                  className="border p-2 w-full rounded-lg mt-1"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </label>

              <label className="text-sm font-medium">
                Layout
                <select
                  className="border p-2 w-full rounded-lg mt-1 bg-white"
                  value={form.layout}
                  onChange={(e) => setForm({ ...form, layout: e.target.value })}
                >
                  {LAYOUTS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Title (optional)
                <input
                  className="border p-2 w-full rounded-lg mt-1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
            </div>

            <label className="text-sm font-medium">
              Subtitle (optional)
              <input
                className="border p-2 w-full rounded-lg mt-1"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </label>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Items</p>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--store-primary)]"
                  onClick={() =>
                    setForm({
                      ...form,
                      items: form.items.concat(emptyItem()).slice(0, 8),
                    })
                  }
                >
                  + Add item
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_220px] gap-3 border rounded-xl p-3">
                    <div className="space-y-2">
                      <input
                        className="border p-2 w-full rounded-lg"
                        placeholder="Title (optional)"
                        value={it.title}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                      />
                      <input
                        className="border p-2 w-full rounded-lg"
                        placeholder="Link (optional) e.g. /shop?tag=gift"
                        value={it.href}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[idx] = { ...next[idx], href: e.target.value };
                          setForm({ ...form, items: next });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        className="border p-2 w-full rounded-lg"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          const next = [...form.items];
                          next[idx] = { ...next[idx], image: file };
                          setForm({ ...form, items: next });
                        }}
                      />
                      {it.imageUrl ? (
                        <p className="text-xs text-slate-500 break-all">Current: {it.imageUrl}</p>
                      ) : (
                        <p className="text-xs text-slate-500">Upload an image for this item</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-semibold"
                        onClick={() => {
                          const next = [...form.items];
                          next[idx] = emptyItem();
                          setForm({ ...form, items: next });
                        }}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
                        onClick={() => {
                          const next = form.items.filter((_, i) => i !== idx);
                          setForm({ ...form, items: next.length ? next : [emptyItem()] });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className={`px-5 py-2 rounded-lg transition text-white ${
                  canSave ? "bg-[var(--store-primary)] hover:bg-[var(--store-primary-dark)]" : "bg-slate-400"
                }`}
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {blocks.map((b) => (
          <div key={b._id} className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {b.layout} • order {b.order ?? 0} • {b.enabled === false ? "disabled" : "enabled"}
                </p>
              </div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {b.title || "Untitled block"}
              </h3>
              {b.subtitle ? (
                <p className="text-sm text-slate-600 line-clamp-2">{b.subtitle}</p>
              ) : null}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {(Array.isArray(b.items) ? b.items : []).slice(0, 6).map((it, idx) => (
                  <div key={idx} className="aspect-[16/10] rounded-lg overflow-hidden border bg-slate-50">
                    {it?.image?.url ? (
                      <img src={it.image.url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-3">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                  onClick={() => editBlock(b)}
                >
                  Edit
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  onClick={() => deleteBlock(b._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="text-slate-500">No graphics blocks yet.</div>
        )}
      </div>
    </div>
  );
}

