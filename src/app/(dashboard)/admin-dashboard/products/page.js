// src/app/(dashboard)/admin-dashboard/products/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // selected product IDs
  const [error, setError] = useState("");

  // Bulk form state - note categories is an array
  const [bulkFlags, setBulkFlags] = useState({
    isTrending: null,
    isFeatured: null,
    isNewArrival: null,
    discount: "",
    price: "",
    stock: "",
    brand: "",
    categories: "",
  });

  // Fetch products, brands, categories
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [pRes, bRes, cRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/brand"),
          fetch("/api/admin/categories"),
        ]);

        const [pData, bData, cData] = await Promise.all([
          pRes.json(),
          bRes.json(),
          cRes.json(),
        ]);

        if (!mounted) return;

        if (pData.success) setProducts(pData.products || []);
        else setProducts([]);

        if (bData.success) setBrands(bData.brands || []);
        else setBrands([]);

        if (cData.success) setCategories(cData.categories || []);
        else setCategories([]);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Error fetching data. Check console.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // selection helpers
  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map((p) => p._id));
  };

  // Build payload: include only fields that are set (not empty/null/empty-array)
  const buildFlagsPayload = () => {
    const payload = {};
    for (const k in bulkFlags) {
      const v = bulkFlags[k];
      // special: for flags booleans (which can be null) we include only if not null
      if (k === "isTrending" || k === "isFeatured" || k === "isNewArrival") {
        if (v !== null) payload[k] = !!v;
        continue;
      }
      if (Array.isArray(v)) {
        if (v.length > 0) payload[k] = v;
        continue;
      }
      if (v !== "" && v !== null && typeof v !== "undefined") {
        // numbers might come as strings - convert where needed on backend
        payload[k] = v;
      }
    }
    return payload;
  };

  // bulk update handler
  const handleBulkUpdate = async () => {
    if (selected.length === 0) {
      alert("❌ No products selected for bulk update!");
      return;
    }

    const flags = buildFlagsPayload();
    if (Object.keys(flags).length === 0) {
      alert("⚠️ Please change at least one field in Bulk Edit.");
      return;
    }

    if (!confirm(`Update ${selected.length} products?`)) return;

    try {
      const res = await fetch("/api/admin/products/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, flags }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ ${data.updatedCount ?? "Some"} products updated!`);
        // refresh products
        const refreshed = await fetch("/api/admin/products").then((r) =>
          r.json()
        );
        if (refreshed.success) setProducts(refreshed.products || []);
        setSelected([]);
        // reset bulk flags (optional)
        setBulkFlags({
          isTrending: null,
          isFeatured: null,
          isNewArrival: null,
          discount: "",
          price: "",
          stock: "",
          brand: "",
          categories: [],
        });
      } else {
        alert("❌ Bulk update failed: " + (data.error || "unknown"));
      }
    } catch (err) {
      console.error("Bulk update error:", err);
      alert("⚠️ Error during bulk update! See console.");
    }
  };

  // helper to display categories for a product (robust)
  // const showCategories = (p) => {
  //   if (Array.isArray(p.categories)) return p.categories.join(", ");
  //   if (p.category) return p.category;
  //   return "-";
  // };

  if (loading) return <p className="text-gray-700">Loading products...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Link
          href="/admin-dashboard/products/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Product
        </Link>
      </div>

      {/* Bulk Edit */}
      <div className="mb-4 p-4 bg-gray-100 rounded flex flex-wrap gap-3 items-center">
        {/* Flags */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bulkFlags.isTrending ?? false}
            onChange={(e) =>
              setBulkFlags({
                ...bulkFlags,
                isTrending: e.target.checked ? true : null,
              })
            }
            className="w-4 h-4"
          />
          <span className="text-sm">Trending</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bulkFlags.isFeatured ?? false}
            onChange={(e) =>
              setBulkFlags({
                ...bulkFlags,
                isFeatured: e.target.checked ? true : null,
              })
            }
            className="w-4 h-4"
          />
          <span className="text-sm">Featured</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bulkFlags.isNewArrival ?? false}
            onChange={(e) =>
              setBulkFlags({
                ...bulkFlags,
                isNewArrival: e.target.checked ? true : null,
              })
            }
            className="w-4 h-4"
          />
          <span className="text-sm">New Arrival</span>
        </label>

        {/* Discount */}
        <input
          type="number"
          placeholder="Discount (%)"
          value={bulkFlags.discount}
          onChange={(e) =>
            setBulkFlags({ ...bulkFlags, discount: e.target.value })
          }
          className="border px-2 py-1 rounded w-36"
        />

        {/* Price */}
        <input
          type="number"
          placeholder="Price"
          value={bulkFlags.price}
          onChange={(e) =>
            setBulkFlags({ ...bulkFlags, price: e.target.value })
          }
          className="border px-2 py-1 rounded w-36"
        />

        {/* Stock */}
        <input
          type="number"
          placeholder="Stock"
          value={bulkFlags.stock}
          onChange={(e) =>
            setBulkFlags({ ...bulkFlags, stock: e.target.value })
          }
          className="border px-2 py-1 rounded w-36"
        />

        {/* Brand dropdown */}
        <select
          value={bulkFlags.brand}
          onChange={(e) =>
            setBulkFlags({ ...bulkFlags, brand: e.target.value })
          }
          className="border px-2 py-1 rounded"
        >
          <option value="">Select Brand (optional)</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Category dropdown */}
        <select
          value={bulkFlags.categories}
          onChange={(e) =>
            setBulkFlags({ ...bulkFlags, categories: e.target.value })
          }
          className="border px-2 py-1 rounded"
        >
          <option value="">Select Category (optional)</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleBulkUpdate}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Update Selected
        </button>
      </div>

      {/* Products table */}
      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-900 text-white text-left">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === products.length && products.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p, i) => (
                <tr key={p._id} className="border-b">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">{i + 1}</td>
                  <td className="px-4 py-3">
                    {p.images?.[0]?.url || p.images?.[0] ? (
                      <img
                        src={p.images[0].url || p.images[0]}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">{p.name}</td>
                  <td className="px-4 py-3 align-top">
                    ₹{p.salePrice ?? p.price}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {p.discount ? p.discount + "%" : "-"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {p.brand?.name || brands.find((b) => String(b._id) === String(p.brand))?.name || "-"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {Array.isArray(p.categories)
                      ? p.categories
                          .map(
                            (id) =>
                              categories.find((c) => String(c._id) === String(id))?.name || ""
                          )
                          .filter(Boolean)
                          .join(", ")
                      : p.category?.name ||
                        categories.find((c) => String(c._id) === String(p.category))?.name ||
                        "-"}
                  </td>
                  <td className="px-4 py-3 align-top">{p.stock ?? "-"}</td>

                  <td className="px-4 py-3 align-top">
                    {p.isTrending && (
                      <span className="px-2 py-1 bg-purple-200 rounded mr-1 text-xs">
                        Trending
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-200 rounded mr-1 text-xs">
                        Featured
                      </span>
                    )}
                    {p.isNewArrival && (
                      <span className="px-2 py-1 bg-green-200 rounded text-xs">
                        New
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin-dashboard/products/edit/${p._id}`}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this product?")) return;
                        try {
                          const res = await fetch(
                            `/api/admin/products/delete/${p._id}`,
                            { method: "DELETE" }
                          );
                          const d = await res.json();
                          if (d.success) {
                            setProducts((prev) =>
                              prev.filter((x) => x._id !== p._id)
                            );
                            setSelected((prev) =>
                              prev.filter((x) => x !== p._id)
                            );
                          } else {
                            alert("Delete failed: " + (d.error || "unknown"));
                          }
                        } catch (err) {
                          console.error("Delete error:", err);
                          alert("Error deleting product.");
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
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