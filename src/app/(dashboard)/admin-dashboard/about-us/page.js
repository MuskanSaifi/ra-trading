// ✅ File: src/app/(dashboard)/admin-dashboard/about/page.jsx
"use client";

import { useEffect, useState } from "react";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function AboutAdminPage() {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: { url: "" },
    stats: [{ label: "", value: "" }],

    companyTitle: "",
    companyContentHtml: "<p></p>",

    directorName: "",
    directorTitle: "",
    directorContentHtml: "<p></p>",
    directorImage: { url: "" },

    trustTitle: "",
    trustContentHtml: "<p></p>",
  });

  const [imageFile, setImageFile] = useState(null);
  const [directorImageFile, setDirectorImageFile] = useState(null);

  // ✅ Load existing About data
  useEffect(() => {
    loadAbout();
  }, []);

  async function loadAbout() {
    try {
      const res = await fetch("/api/admin/about");
      const data = await res.json();

      if (data?.about) {
        setForm({
          title: data.about.title || "",
          subtitle: data.about.subtitle || "",
          description: data.about.description || "",
          stats: data.about.stats?.length ? data.about.stats : [{ label: "", value: "" }],
          image: data.about.image || { url: "" },

          companyTitle: data.about.companyTitle || "About Company",
          companyContentHtml: data.about.companyContentHtml || "<p></p>",

          directorName: data.about.directorName || "",
          directorTitle: data.about.directorTitle || "Director",
          directorContentHtml: data.about.directorContentHtml || "<p></p>",
          directorImage: data.about.directorImage || { url: "" },

          trustTitle: data.about.trustTitle || "Trust",
          trustContentHtml: data.about.trustContentHtml || "<p></p>",
        });
      }
    } catch (err) {
      console.error("Failed to load:", err);
    }
  }

  // ✅ Submit Form
  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("data", JSON.stringify(form));

    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (directorImageFile) {
      formData.append("directorImage", directorImageFile);
    }

    try {
      const res = await fetch("/api/admin/about", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Saved successfully!");
        loadAbout();
      } else {
        alert("Error saving data");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ✅ Add stat row
  function addStat() {
    setForm({ ...form, stats: [...form.stats, { label: "", value: "" }] });
  }

  // ✅ Update stat
  function updateStat(i, key, value) {
    const newStats = [...form.stats];
    newStats[i][key] = value;
    setForm({ ...form, stats: newStats });
  }

  return (
    <div className="max-w-5xl pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">About page content</h1>
        <p className="text-sm text-slate-500 mt-1">
          Home page uses section-1 only. About page shows section-1 + Company + Director + Trust.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900]">Section 1 (Home + About)</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                placeholder="Title"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                placeholder="Subtitle"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[110px] outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                placeholder="Description"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Image</p>
              {form.image?.url && (
                <img
                  src={form.image.url}
                  alt=""
                  className="w-full max-w-[280px] h-44 object-cover rounded-xl border border-slate-200"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>

            <div>
              <label className="font-semibold text-sm block mb-2 text-slate-700">
                Stats (Label + Value)
              </label>

              {form.stats.map((s, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <input
                    value={s.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="Label"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                  />
                  <input
                    value={s.value}
                    onChange={(e) => updateStat(i, "value", e.target.value)}
                    placeholder="Value"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addStat}
                className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                + Add More
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900]">Section 2 (About Company)</h2>
          <div className="grid gap-3">
            <input
              value={form.companyTitle}
              onChange={(e) => setForm({ ...form, companyTitle: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
              placeholder="Section title (e.g. About Company)"
            />
            <BlogRichEditor
              key={`company-${form.companyContentHtml?.length || 0}`}
              initialContent={form.companyContentHtml || "<p></p>"}
              onChange={(html) => setForm((p) => ({ ...p, companyContentHtml: html }))}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900]">Section 3 (Director)</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Director name</label>
              <input
                value={form.directorName}
                onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                placeholder="e.g. Mr. ABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={form.directorTitle}
                onChange={(e) => setForm({ ...form, directorTitle: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
                placeholder="e.g. Director / Founder"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Director photo</p>
              {form.directorImage?.url && (
                <img
                  src={form.directorImage.url}
                  alt=""
                  className="w-full max-w-[280px] h-44 object-cover rounded-xl border border-slate-200"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setDirectorImageFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <div className="sm:col-span-1" />
          </div>

          <BlogRichEditor
            key={`director-${form.directorContentHtml?.length || 0}`}
            initialContent={form.directorContentHtml || "<p></p>"}
            onChange={(html) => setForm((p) => ({ ...p, directorContentHtml: html }))}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900]">Section 4 (Trust)</h2>
          <div className="grid gap-3">
            <input
              value={form.trustTitle}
              onChange={(e) => setForm({ ...form, trustTitle: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900]"
              placeholder="Section title (e.g. Trust)"
            />
            <BlogRichEditor
              key={`trust-${form.trustContentHtml?.length || 0}`}
              initialContent={form.trustContentHtml || "<p></p>"}
              onChange={(html) => setForm((p) => ({ ...p, trustContentHtml: html }))}
            />
          </div>
        </section>

        <button
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ff9900] text-[#1a1a1a] font-bold hover:opacity-95 transition"
          type="submit"
        >
          Save
        </button>
      </form>
    </div>
  );
}
