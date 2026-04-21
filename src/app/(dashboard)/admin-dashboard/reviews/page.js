"use client";

import { useEffect, useState } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    rating: "",
    review: "",
    photo: null,
  });

  const [preview, setPreview] = useState(null);

  // -----------------------------
  // FETCH ALL REVIEWS
  // -----------------------------
  const fetchReviews = async () => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch("/api/admin/reviews", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return;
    }
    const data = await res.json();
    if (data.success) setReviews(data.reviews);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // -----------------------------
  // HANDLE INPUT
  // -----------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, photo: file });
    if (file) setPreview(URL.createObjectURL(file));
  };

  // -----------------------------
  // SUBMIT (ADD / EDIT)
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("data", JSON.stringify(form));

    if (form.photo) {
      formData.append("photo", form.photo);
    }

    const url = editingReview
      ? `/api/admin/reviews/${editingReview._id}`
      : "/api/admin/reviews";

    const method = editingReview ? "PUT" : "POST";

    const token = localStorage.getItem("adminToken");
    const res = await fetch(url, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return;
    }
    const data = await res.json();

    if (data.success) {
      fetchReviews();
      resetForm();
    }
  };

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setEditingReview(null);
    setForm({
      name: "",
      email: "",
      rating: "",
      review: "",
      photo: null,
    });
    setPreview(null);
  };

  // -----------------------------
  // EDIT
  // -----------------------------
  const handleEdit = (r) => {
    setEditingReview(r);
    setForm({
      name: r.name,
      email: r.email,
      rating: r.rating,
      review: r.review,
      photo: null,
    });
    setPreview(r.photo || null);
  };

  // -----------------------------
  // DELETE
  // -----------------------------
  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;

    const token = localStorage.getItem("adminToken");
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return;
    }

    const data = await res.json();
    if (data.success) fetchReviews();
  };

  return (
    <div className="p-6">

      {/* ---------------------- ADD / EDIT FORM ---------------------- */}
      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl font-bold mb-4">
          {editingReview ? "Edit Review" : "Add Review"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="p-2 border rounded"
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            className="p-2 border rounded"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            className="p-2 border rounded"
            type="number"
            name="rating"
            placeholder="Rating (1-5)"
            value={form.rating}
            onChange={handleChange}
            min="1"
            max="5"
            required
          />

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="p-2 border rounded w-full"
            />

            {preview && (
              <img
                src={preview}
                className="w-20 h-20 rounded mt-2 object-cover"
                alt="preview"
              />
            )}
          </div>

          <textarea
            className="p-2 border rounded col-span-1 md:col-span-2"
            name="review"
            placeholder="Write review..."
            rows="3"
            value={form.review}
            onChange={handleChange}
            required
          />

          <div className="col-span-2 flex justify-between mt-3">
            {editingReview && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded ml-auto"
            >
              {editingReview ? "Update Review" : "Add Review"}
            </button>
          </div>

        </form>
      </div>

      {/* ---------------------- REVIEWS TABLE ---------------------- */}
      <div className="bg-white shadow p-4 rounded">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Rating</th>
              <th className="p-2 border">Review</th>
              <th className="p-2 border">Photo</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((r) => (
              <tr key={r._id}>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.email}</td>
                <td className="p-2 border">{r.rating}</td>
                <td className="p-2 border">{r.review}</td>
                <td className="p-2 border">
                  {r.photo ? (
                    <img
                      src={r.photo}
                      alt="review"
                      className="w-14 h-14 rounded object-cover"
                    />
                  ) : "No Photo"}
                </td>

                <td className="p-2 border">
                  <button
                    onClick={() => handleEdit(r)}
                    className="px-2 py-1 bg-green-600 text-white rounded mr-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(r._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
