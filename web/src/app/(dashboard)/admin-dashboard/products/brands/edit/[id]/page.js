"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/clientApiError";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function EditBrandPage() {
  const params = useParams();
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

  const [image, setImage] = useState(null); // {file} or {url, public_id}
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Slug Generate Function
  const generateSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  // ✅ Fetch Brand
  useEffect(() => {
    const fetchBrand = async () => {
      const res = await fetch(`/api/admin/brand/${params.id}`);
      const data = await res.json();

      if (data.success) {
        setForm({
          name: data.brand.name,
          slug: data.brand.slug ?? "",      // ✅ Added slug
          description: data.brand.description,
          pageTitle: data.brand.pageTitle || "",
          metaTitle: data.brand.metaTitle || "",
          metaKeywords: data.brand.metaKeywords || "",
          metaDescription: data.brand.metaDescription || "",
          contentHtml: data.brand.contentHtml || "<p></p>",
          status: data.brand.status,
        });

        if (data.brand.image) {
          setImage({
            url: data.brand.image.url,
            public_id: data.brand.image.public_id,
          });
        }
      }
      setLoading(false);
    };
    fetchBrand();
  }, [params.id]);

  // ✅ Auto slug when name updates
  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    setForm({
      ...form,
      name: nameValue,
      slug: generateSlug(nameValue),
    });
  };

  // ✅ Manual slug change
  const handleSlugChange = (e) => {
    setForm({ ...form, slug: e.target.value });
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));
      if (image?.file) formData.append("image", image.file);

      const res = await fetch(`/api/admin/brand/${params.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Error updating brand.");
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("✅ Brand Updated!");
        router.push("/admin-dashboard/products/brands");
      } else {
        alert("❌ " + (data.error || "Error updating brand."));
      }
    } catch (error) {
      alert("⚠️ Network error while updating brand.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  // 🟢 Preview Logic
  const previewUrl =
    image?.file
      ? URL.createObjectURL(image.file)
      : image?.url
      ? image.url
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-gray-900 p-6 rounded shadow space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold mb-4">Edit Brand</h2>

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

      {/* Description */}
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
          key={`brand-edit-content-${params.id}`}
          initialContent={form.contentHtml || "<p></p>"}
          onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
        />
      </div>

      {/* Image Upload */}
      <input
        type="file"
        onChange={(e) => setImage({ file: e.target.files[0] })}
      />

      {/* Preview */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-32 h-32 object-cover rounded border"
        />
      )}

      {/* Status */}
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
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Updating..." : "Update Brand"}
      </button>
    </form>
  );
}
