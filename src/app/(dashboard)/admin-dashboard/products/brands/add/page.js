"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/clientApiError";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function AddBrandPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    pageTitle: "",
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    contentHtml: "<p></p>",
    status: "active",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Generate slug from name
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // ✅ Update name + auto slug
  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    setForm({
      ...form,
      name: nameValue,
      slug: generateSlug(nameValue),
    });
  };

  // ✅ Manually edit slug
  const handleSlugChange = (e) => {
    setForm({ ...form, slug: e.target.value });
  };

  // Image select & preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else setPreview(null);
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));
      if (image) formData.append("image", image);

      const res = await fetch("/api/admin/brand", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Error adding brand.");
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("✅ Brand Added!");
        router.push("/admin-dashboard/products/brands");
      } else {
        alert("❌ " + (data.error || "Error adding brand."));
      }
    } catch (error) {
      alert("⚠️ Network error while adding brand.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-gray-700 p-6 rounded shadow space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold mb-4">Add Brand</h2>

      {/* Brand Name */}
      <input
        type="text"
        placeholder="Brand Name"
        value={form.name}
        onChange={handleNameChange}
        className="w-full border px-3 py-2 rounded"
        required
      />

      {/* Slug */}
      <input
        type="text"
        placeholder="Slug"
        value={form.slug}
        onChange={handleSlugChange}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="text"
        placeholder="Page Title"
        value={form.pageTitle}
        onChange={(e) => setForm({ ...form, pageTitle: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="text"
        placeholder="Meta Title"
        value={form.metaTitle}
        onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="text"
        placeholder="Meta Keywords (comma separated)"
        value={form.metaKeywords}
        onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />

      <textarea
        placeholder="Meta Description"
        value={form.metaDescription}
        onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
        className="w-full border px-3 py-2 rounded"
        rows={3}
      />

      <div>
        <p className="text-sm font-semibold mb-2">Page Content</p>
        <BlogRichEditor
          key="brand-new-content"
          initialContent={form.contentHtml || "<p></p>"}
          onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
        />
      </div>

      <input type="file" onChange={handleImageChange} />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-32 h-32 object-cover rounded border mt-2"
        />
      )}

      <select
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Brand"}
      </button>
    </form>
  );
}
