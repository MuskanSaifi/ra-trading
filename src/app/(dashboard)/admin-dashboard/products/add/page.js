// admin-dashboard/products/add

// ✅ Full Updated Add Product Page - brand & category store _id
"use client";

import { useState, useEffect } from "react";

// ✅ Define HERE
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    category: "", // ✅ store category ID
    subCategory: "", // ✅ untouched string
    brand: "", // ✅ store brand ID
    gender: "Unisex",
    price: "",
    discount: "",
    salePrice: "",
    currency: "₹",
    sku: "",
    stock: "",
    minOrder: 1,
    codAvailable: true,
    imageBgColor: "#ffffff",
    attributes: [],
    isTrending: false,
    isFeatured: false,
    isNewArrival: false,
    season: "All",
    images: [],
    metaTitle: "",
    metaDescription: "",
    tags: "",
    status: "active",
    publishDate: "",
  });

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandRes, catRes, attrRes] = await Promise.all([
          fetch("/api/admin/brand"),
          fetch("/api/admin/categories"),
          fetch("/api/admin/attributes"),
        ]);

        const [brandData, catData, attrData] = await Promise.all([
          brandRes.json(),
          catRes.json(),
          attrRes.json(),
        ]);

        if (brandData.success) setBrands(brandData.brands);
        if (catData.success) setCategories(catData.categories);
        if (attrData.success) setAttributes(attrData.attributes);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const handleCheckbox = (field, value) => {
    setForm((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value],
      };
    });
  };

  const handleAttributeChange = (attrName, value) => {
    setForm((prev) => {
      const updated = [...prev.attributes];
      const index = updated.findIndex((a) => a.name === attrName);
      if (index >= 0) {
        updated[index].value = value;
      } else {
        updated.push({ name: attrName, value });
      }
      return { ...prev, attributes: updated };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 5) {
      alert("❌ Max 5 images allowed.");
      return;
    }
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...previews] }));
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const updated = [...prev.images];
      updated.splice(index, 1);
      return { ...prev, images: updated };
    });
  };

  const moveImage = (from, to) => {
    if (to < 0 || to >= form.images.length) return;
    setForm((prev) => {
      const updated = [...prev.images];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return { ...prev, images: updated };
    });
  };

  const calculateSalePrice = () => {
    const price = parseFloat(form.price) || 0;
    const discount = parseFloat(form.discount) || 0;
    return price - (price * discount) / 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      const productData = {
        ...form,
        salePrice: calculateSalePrice(),
        images: undefined,
      };

      formData.append("data", JSON.stringify(productData));
      form.images.forEach((img) => formData.append("images", img.file));

      const res = await fetch("/api/admin/products/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Product Added Successfully!");
        setForm({
          ...form,
          name: "",
          description: "",
          category: "",
          subCategory: "",
          brand: "",
          price: "",
          discount: "",
          salePrice: "",
          sku: "",
          stock: "",
          images: [],
        });
      } else {
        alert("❌ " + (data.error || "Something went wrong."));
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error submitting form!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-gray-900">
      <h2 className="text-3xl font-bold mb-6">Add Product</h2>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-8">

        {/* ✅ Basic Info */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Basic Information</h3>

          <input
            type="text"
            placeholder="Product Name"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = slugify(name);
              setForm({ ...form, name, slug });
            }}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <input
            type="text"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <textarea
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          />

          {/* ✅ Select Category (store _id) */}
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Sub-category"
            value={form.subCategory}
            onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          />

          {/* ✅ Select Brand (store _id) */}
          <select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option>Men</option>
            <option>Women</option>
            <option>Unisex</option>
          </select>
        </section>

        {/* ✅ Pricing */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Pricing</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
  type="number"
  placeholder="Price"
  value={form.price}
  onChange={(e) => {
    let val = e.target.value;
    // ✅ Only allow 2 decimal
    val = val.includes(".")
      ? val.split(".")[0] + "." + val.split(".")[1].slice(0, 2)
      : val;

    setForm({
      ...form,
      price: val ? parseFloat(val) : "",
    });
  }}
  step="0.01"
  className="w-full border rounded px-3 py-2"
  required
/>


            <input
  type="number"
  placeholder="Discount (%)"
  value={form.discount}
  onChange={(e) => {
    let val = e.target.value;
    val = val.includes(".")
      ? val.split(".")[0] + "." + val.split(".")[1].slice(0, 2)
      : val;

    setForm({
      ...form,
      discount: val ? parseFloat(val) : "",
    });
  }}
  step="0.01"
  className="w-full border rounded px-3 py-2"
/>

          </div>

          <div className="mt-2 text-gray-700">
            Sale Price:{" "}
            <span className="font-bold">
              ₹{calculateSalePrice().toFixed(2)}
            </span>
          </div>
        </section>

        {/* ✅ Inventory */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Inventory & checkout rules</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />

            <input
              type="number"
              placeholder="Stock Quantity"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value ? parseInt(e.target.value) : "",
                })
              }
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="number"
              min={1}
              placeholder="Minimum order quantity"
              value={form.minOrder}
              onChange={(e) =>
                setForm({
                  ...form,
                  minOrder: e.target.value ? parseInt(e.target.value, 10) : 1,
                })
              }
              className="w-full border rounded px-3 py-2 col-span-2 sm:col-span-1"
            />
            <label className="flex items-center gap-3 col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.codAvailable}
                onChange={(e) =>
                  setForm({ ...form, codAvailable: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-[var(--store-primary)] focus:ring-[var(--store-primary)]"
              />
              <span className="text-sm font-medium">
                Cash on delivery available for this product
              </span>
            </label>
          </div>
        </section>

        {/* ✅ Display */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Display</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Image background color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.imageBgColor || "#ffffff"}
                  onChange={(e) =>
                    setForm({ ...form, imageBgColor: e.target.value })
                  }
                  className="h-10 w-14 p-0 border rounded"
                  aria-label="Image background color"
                />
                <input
                  type="text"
                  value={form.imageBgColor || "#ffffff"}
                  onChange={(e) =>
                    setForm({ ...form, imageBgColor: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div
                className="h-16 w-full flex items-center justify-center"
                style={{ backgroundColor: form.imageBgColor || "#ffffff" }}
              >
                <span className="text-xs text-gray-600">Preview</span>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ Attributes */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Attributes</h3>
          {attributes.map((attr) => (
            <div key={attr._id} className="mb-3">
              <label className="block font-medium mb-1">{attr.name}</label>
              <select
                onChange={(e) =>
                  handleAttributeChange(attr.name, e.target.value)
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select {attr.name}</option>
                {attr.values.map((val, i) => (
                  <option key={i} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        {/* ✅ Flags */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Product Flags</h3>
          <label>
            <input
              type="checkbox"
              checked={form.isTrending}
              onChange={(e) =>
                setForm({ ...form, isTrending: e.target.checked })
              }
            />{" "}
            Trending
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
            />{" "}
            Featured
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={form.isNewArrival}
              onChange={(e) =>
                setForm({ ...form, isNewArrival: e.target.checked })
              }
            />{" "}
            New Arrival
          </label>
        </section>

        {/* ✅ Media */}
        <section>
          <h3 className="text-xl font-semibold mb-3">Media</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <div className="grid grid-cols-3 gap-4">
            {form.images.map((img, index) => (
              <div
                key={index}
                className="relative border rounded-lg overflow-hidden shadow"
              >
                <img
                  src={img.url}
                  alt={`Image ${index}`}
                  className="w-full h-32 object-cover"
                />
                <div className="flex justify-between bg-gray-100 text-xs">
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    disabled={index === 0}
                    className="px-2 py-1 text-blue-600"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="px-2 py-1 text-red-600"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    disabled={index === form.images.length - 1}
                    className="px-2 py-1 text-blue-600"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 w-full"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
