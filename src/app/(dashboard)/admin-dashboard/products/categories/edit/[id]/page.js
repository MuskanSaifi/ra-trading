"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/clientApiError";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function EditCategoryPage() {
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

  const [image, setImage] = useState(null); // {file} | {url, public_id}
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const generateSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  useEffect(() => {
    const fetchCategory = async () => {
      const res = await fetch(`/api/admin/categories/${params.id}`);
      const data = await res.json();

      if (data.success) {
        setForm({
          name: data.category.name,
          slug: data.category.slug,
          description: data.category.description,
          pageTitle: data.category.pageTitle || "",
          metaTitle: data.category.metaTitle || "",
          metaKeywords: data.category.metaKeywords || "",
          metaDescription: data.category.metaDescription || "",
          contentHtml: data.category.contentHtml || "<p></p>",
          status: data.category.status,
        });

        if (data.category.image) {
          setImage({
            url: data.category.image.url,
            public_id: data.category.image.public_id,
          });
        }
      }

      setLoading(false);
    };

    fetchCategory();
  }, [params.id]);

  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    setForm({ ...form, name: nameValue, slug: generateSlug(nameValue) });
  };

  const handleSlugChange = (e) => {
    setForm({ ...form, slug: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));
      if (image?.file) formData.append("image", image.file);

      const res = await fetch(`/api/admin/categories/${params.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Error updating category.");
        alert(`❌ ${message}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("✅ Category Updated!");
        router.push("/admin-dashboard/products/categories");
      } else {
        alert("❌ " + (data.error || "Error updating category."));
      }
    } catch (error) {
      alert("⚠️ Network error while updating category.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

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
      <h2 className="text-xl font-bold mb-4">Edit Category</h2>

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
          key={`category-edit-content-${params.id}`}
          initialContent={form.contentHtml || "<p></p>"}
          onChange={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
        />
      </div>

      <input
        type="file"
        onChange={(e) => setImage({ file: e.target.files[0] })}
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-32 h-32 object-cover rounded border"
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
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Updating..." : "Update Category"}
      </button>
    </form>
  );
}
