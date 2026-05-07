"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/clientApiError";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function AddCategoryPage() {
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

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    setForm({
      ...form,
      name: nameValue,
      slug: generateSlug(nameValue),
    });
  };

  const handleSlugChange = (e) => {
    setForm({ ...form, slug: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));
      if (image) formData.append("image", image);

      const res = await fetch("/api/admin/categories", { method: "POST", body: formData });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Error adding category.");
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("✅ Category Added!");
        router.push("/admin-dashboard/products/categories");
      } else {
        alert("❌ " + (data.error || "Error adding category."));
      }
    } catch (error) {
      alert("⚠️ Network error while adding category.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else setPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white text-gray-700 p-6 rounded shadow space-y-4">
      <input
        type="text"
        placeholder="Category Name"
        value={form.name}
        onChange={handleNameChange}
        className="w-full border px-3 py-2 rounded"
        required
      />

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
          key="category-new-content"
          initialContent={form.contentHtml || "<p></p>"}
          onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
        />
      </div>

      <input type="file" onChange={handleImageChange} />
      {preview && <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded border mt-2" />}

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
        {loading ? "Saving..." : "Save Category"}
      </button>
    </form>
  );
}
