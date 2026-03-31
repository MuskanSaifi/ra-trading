"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogRichEditor from "@/components/admin/BlogRichEditor";

export default function AdminBlogNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [published, setPublished] = useState(true);
  const [banner, setBanner] = useState({ url: "", publicId: "" });
  const [contentHtml, setContentHtml] = useState("");
  const [saving, setSaving] = useState(false);

  const uploadBanner = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload/blog", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    setBanner({ url: data.url, publicId: data.publicId });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    if (!excerpt.trim()) {
      alert("Excerpt is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          slug: slug.trim() || undefined,
          author: author.trim(),
          category: category.trim(),
          tags,
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
          metaKeywords: metaKeywords.trim(),
          published,
          banner,
          contentHtml: contentHtml || "<p></p>",
          blocks: [],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      router.push("/admin-dashboard/blog");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ff9900]/40 focus:border-[#ff9900] outline-none";

  return (
    <div className="max-w-4xl pb-16">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/admin-dashboard/blog" className="text-sm text-slate-600 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create new blog</h1>
      </div>

      <form onSubmit={submit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900] mb-4">
            Basic information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                className={inputClass}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto from title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
              <input
                className={inputClass}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Excerpt <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`${inputClass} min-h-[88px]`}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                placeholder="Short summary for listings and SEO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Beauty Tips, Hair Care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                className={inputClass}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hair, beauty, tips"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900] mb-4">
            Feature image
          </h2>
          {banner.url && (
            <img
              src={banner.url}
              alt=""
              className="max-h-48 rounded-xl border border-slate-200 mb-3 object-cover w-full max-w-md"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                await uploadBanner(f);
              } catch (err) {
                alert(err.message);
              }
            }}
            className="text-sm"
          />
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900] mb-4">
            Content
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            Bold, headings, lists, links, images (uploads to Cloudinary), code blocks, and more.
          </p>
          <BlogRichEditor key="new-post" initialContent="<p></p>" onChange={setContentHtml} />
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#ff9900] mb-4">
            SEO settings
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta title</label>
              <input
                className={inputClass}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Defaults to post title if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta description</label>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta keywords</label>
              <input
                className={inputClass}
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="comma-separated keywords"
              />
            </div>
          </div>
        </section>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-slate-300"
            />
            Published (visible on store)
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ff9900] text-[#1a1a1a] font-bold disabled:opacity-50 hover:opacity-95 transition"
        >
          {saving ? "Publishing…" : "Create post"}
        </button>
      </form>
    </div>
  );
}
