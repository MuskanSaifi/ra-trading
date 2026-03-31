"use client";

import { useEffect, useState } from "react";

/** Must match `<Sections section="…" />` on the storefront (e.g. home page). */
const SECTION_OPTIONS = [
  { value: "landingpage-frontsection", label: "Homepage hero" },
];

export default function BannerAdminPage() {
  const [banners, setBanners] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    title: "",
    subtitle: "",
    section: "",
    buttonText1: "",
    buttonText2: "",
    image: null,
  });

  const fetchBanners = async () => {
    const res = await fetch("/api/admin/sections");
    const data = await res.json();
    setBanners(data?.banners || []);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      _id: form._id,
      title: form.title,
      subtitle: form.subtitle,
      section: form.section,
      buttonText1: form.buttonText1,
      buttonText2: form.buttonText2,
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));
    if (form.image) fd.append("image", form.image);

    const endpoint = form._id
      ? `/api/admin/sections/${form._id}`
      : `/api/admin/sections`;

    const res = await fetch(endpoint, {
      method: form._id ? "PUT" : "POST",
      body: fd,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json?.error || `Save failed (${res.status})`);
      return;
    }

    setOpen(false);
    resetForm();
    fetchBanners();
  };

  const resetForm = () => {
    setForm({
      _id: null,
      title: "",
      subtitle: "",
      section: SECTION_OPTIONS[0]?.value || "landingpage-frontsection",
      buttonText1: "",
      buttonText2: "",
      image: null,
    });
  };

  const handleDelete = async (id) => {
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Banner Management</h1>

      <div className="border rounded-xl shadow p-4 bg-white">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-3 items-center">
          <h2 className="text-xl font-semibold">All Banners</h2>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            + Add Banner
          </button>
        </div>

        {/* MODAL */}
        {open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl animate-fadeIn">
              <h2 className="text-xl font-semibold">
                {form._id ? "Edit Banner" : "Add Banner"}
              </h2>

              <input
                className="border p-2 w-full rounded-lg"
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />

              <input
                className="border p-2 w-full rounded-lg"
                placeholder="Subtitle"
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
              />

              <label className="block text-sm font-medium text-gray-700">
                Section (where it appears on the site)
              </label>
              <select
                className="border p-2 w-full rounded-lg bg-white"
                value={
                  SECTION_OPTIONS.some((o) => o.value === form.section)
                    ? form.section
                    : form.section || SECTION_OPTIONS[0]?.value
                }
                onChange={(e) =>
                  setForm({ ...form, section: e.target.value })
                }
              >
                {form.section &&
                  !SECTION_OPTIONS.some((o) => o.value === form.section) && (
                    <option value={form.section}>
                      {form.section} (current)
                    </option>
                  )}
                {SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>

              <input
                className="border p-2 w-full rounded-lg"
                placeholder="Button 1 Text"
                value={form.buttonText1}
                onChange={(e) =>
                  setForm({ ...form, buttonText1: e.target.value })
                }
              />

              <input
                className="border p-2 w-full rounded-lg"
                placeholder="Button 2 Text"
                value={form.buttonText2}
                onChange={(e) =>
                  setForm({ ...form, buttonText2: e.target.value })
                }
              />

              <input
                type="file"
                className="border p-2 w-full rounded-lg"
                onChange={(e) =>
                  setForm({ ...form, image: e.target.files[0] })
                }
              />

              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  onClick={handleSubmit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BANNER LIST (RESPONSIVE) */}
        <div className="mt-6">
          {banners?.length === 0 && (
            <p className="text-gray-500 text-center py-6">
              No banners found...
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b) => (
              <div
                key={b._id}
                className="border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                    {b.title}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-3">
                    {b.subtitle}
                  </p>

                  <p className="text-xs text-gray-500">
                    Section: {b.section}
                  </p>

                  {b.bannerUrl?.url && (
                    <img
                      src={b.bannerUrl.url}
                      className="w-full h-36 object-cover rounded-md mt-2"
                    />
                  )}

                  <div className="flex justify-between mt-3">
                    <button
                      className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      onClick={() => {
                        setForm({
                          _id: b._id,
                          title: b.title,
                          subtitle: b.subtitle,
                          section: b.section,
                          buttonText1: b.buttonText1,
                          buttonText2: b.buttonText2,
                          image: null,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      onClick={() => handleDelete(b._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}