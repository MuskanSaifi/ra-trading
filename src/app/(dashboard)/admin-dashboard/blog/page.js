"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", { credentials: "include" });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this post and remove images from Cloudinary?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || "Delete failed");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Blog posts</h1>
        <Link
          href="/admin-dashboard/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff9900] text-white font-semibold hover:opacity-95"
        >
          <Plus size={18} /> New post
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3 hidden md:table-cell">Slug</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50/80">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">{p.slug}</td>
                  <td className="p-3">
                    {p.published ? (
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-semibold">
                        Live
                      </span>
                    ) : (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Link
                      href={`/admin-dashboard/blog/edit/${p._id}`}
                      className="inline-flex p-2 rounded-lg border hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(p._id)}
                      className="inline-flex p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
