"use client";

import { useEffect, useState } from "react";

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.categories);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchCategories();
    else alert("❌ " + data.error);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 min-h-screen">
        {/* Header + Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
            onClick={() =>
              (window.location.href =
                "/admin-dashboard/products/categories/add")
            }
          >
            + Add Category
          </button>
        </div>
        <p className="text-black text-center mt-10 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header + Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
          onClick={() =>
            (window.location.href = "/admin-dashboard/products/categories/add")
          }
        >
          + Add Category
        </button>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <p className="text-black text-center mt-10 font-medium">
          No categories found!
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((cat) => (
            <li
              key={cat._id}
              className="flex justify-between items-center p-3 bg-white rounded shadow-sm border"
            >
              <div className="flex items-center gap-3">
                {cat.image?.url && (
                  <img
                    src={cat.image.url}
                    alt={cat.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                )}
                <span className="text-gray-900 font-medium text-lg">
                  {cat.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-medium"
                  onClick={() =>
                    (window.location.href = `/admin-dashboard/products/categories/edit/${cat._id}`)
                  }
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium"
                  onClick={() => handleDelete(cat._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
