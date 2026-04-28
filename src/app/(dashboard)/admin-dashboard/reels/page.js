"use client";

import { useEffect, useMemo, useState } from "react";

function emptyForm() {
  return {
    _id: null,
    enabled: true,
    order: 0,
    title: "",
    videoUrl: "",
    videoPublicId: "",
    posterUrl: "",
    posterPublicId: "",
  };
}

export default function AdminReelsPage() {
  const [reels, setReels] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const fetchReels = async () => {
    const res = await fetch("/api/admin/reels");
    const data = await res.json().catch(() => ({}));
    setReels(Array.isArray(data?.reels) ? data.reels : []);
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const canSave = useMemo(() => {
    return !!String(form.videoUrl || "").trim();
  }, [form.videoUrl]);

  const reset = () => setForm(emptyForm());

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload = {
        enabled: !!form.enabled,
        order: Number(form.order) || 0,
        title: form.title || "",
        videoUrl: form.videoUrl || "",
        videoPublicId: form.videoPublicId || "",
        posterUrl: form.posterUrl || "",
        posterPublicId: form.posterPublicId || "",
      };

      const endpoint = form._id ? `/api/admin/reels/${form._id}` : "/api/admin/reels";
      const method = form._id ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);

      setOpen(false);
      reset();
      await fetchReels();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (r) => {
    setForm({
      _id: r._id,
      enabled: r.enabled !== false,
      order: r.order || 0,
      title: r.title || "",
      videoUrl: r.video?.url || "",
      videoPublicId: r.video?.public_id || "",
      posterUrl: r.poster?.url || "",
      posterPublicId: r.poster?.public_id || "",
    });
    setOpen(true);
  };

  const del = async (id) => {
    if (!confirm("Delete this reel?")) return;
    await fetch(`/api/admin/reels/${id}`, { method: "DELETE" });
    fetchReels();
  };

  const uploadVideo = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/reels", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error || `Upload failed (${res.status})`);
      setForm((p) => ({
        ...p,
        videoUrl: data.url,
        videoPublicId: data.publicId,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Home Reels</h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload videos (mp4/webm/mov). Videos are saved to Cloudinary under the <b>reels</b> folder.
            If there are no reels, the section won’t show on the home page.
          </p>
        </div>
        <button
          type="button"
          className="bg-[var(--store-primary)] hover:bg-[var(--store-primary-dark)] text-white px-5 py-2 rounded-lg transition font-semibold"
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          + Add reel
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl space-y-4 shadow-xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-semibold">{form._id ? "Edit reel" : "Add reel"}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Enabled
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Show on home page</span>
                </div>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Order (higher shows first)
                <input
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full mt-1 outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Title (optional)
                <input
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full mt-1 outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. New arrivals reel"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Video upload <span className="text-red-500">*</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="block w-full mt-1 text-sm"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    await uploadVideo(f);
                  }}
                  disabled={uploading}
                />
                {form.videoUrl ? (
                  <p className="text-xs text-slate-500 mt-1 break-all">
                    Uploaded: {form.videoUrl}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Choose a video file to upload to Cloudinary.</p>
                )}
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Poster image URL (optional)
                <input
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full mt-1 outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                  value={form.posterUrl}
                  onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/.../image/upload/.../thumb.jpg"
                />
              </label>
            </div>

            {form.videoUrl ? (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Preview</p>
                <video
                  src={form.videoUrl}
                  poster={form.posterUrl || undefined}
                  className="w-full max-h-[360px] rounded-xl bg-black"
                  controls
                  playsInline
                />
              </div>
            ) : null}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 bg-slate-200 rounded-lg font-semibold"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-5 py-2 rounded-lg transition font-semibold text-white ${
                  canSave ? "bg-[var(--store-primary)] hover:bg-[var(--store-primary-dark)]" : "bg-slate-400"
                }`}
                onClick={submit}
                disabled={!canSave || saving || uploading}
              >
                {uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reels.map((r) => (
          <div key={r._id} className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                order {r.order ?? 0} • {r.enabled === false ? "disabled" : "enabled"}
              </p>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {r.title || "Reel"}
              </h3>

              {r.video?.url ? (
                <video
                  src={r.video.url}
                  poster={r.poster?.url || undefined}
                  className="w-full rounded-xl bg-black max-h-[240px]"
                  controls
                  playsInline
                />
              ) : null}

              <div className="flex justify-between pt-2">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                  onClick={() => edit(r)}
                >
                  Edit
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  onClick={() => del(r._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {reels.length === 0 && (
          <div className="text-slate-500">No reels yet.</div>
        )}
      </div>
    </div>
  );
}

