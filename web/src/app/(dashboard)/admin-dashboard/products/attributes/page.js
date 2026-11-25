"use client";

import { useState, useEffect } from "react";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [name, setName] = useState("");
  const [values, setValues] = useState("");

  const [editId, setEditId] = useState(null);

  const fetchAttributes = async () => {
    const res = await fetch("/api/admin/attributes");
    const data = await res.json();
    if (data.success) setAttributes(data.attributes);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleAdd = async () => {
    if (!name || !values) return alert("Please fill name and values");

    const valsArray = values.split(",").map((v) => v.trim());

    const res = await fetch("/api/admin/attributes", {
      method: "POST",
      body: JSON.stringify({ name, values: valsArray }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      alert("Attribute added!");
      setName("");
      setValues("");
      fetchAttributes();
    } else {
      alert("Error: " + data.error);
    }
  };

  const handleUpdate = async () => {
    const valsArray = values.split(",").map((v) => v.trim());

    const res = await fetch(`/api/admin/attributes/${editId}`, {
      method: "PUT",
      body: JSON.stringify({ name, values: valsArray }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      alert("Updated!");
      setName("");
      setValues("");
      setEditId(null);
      fetchAttributes();
    } else {
      alert("Error: " + data.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete Attribute?")) return;

    const res = await fetch(`/api/admin/attributes/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) {
      fetchAttributes();
    } else {
      alert("Error: " + data.error);
    }
  };

  const startEditing = (attr) => {
    setEditId(attr._id);
    setName(attr.name);
    setValues(attr.values.join(", "));
  };

  return (
    <div className="p-6 text-gray-800">
      <h2 className="text-2xl font-bold mb-4">Attributes</h2>

      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Attribute Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="text"
          placeholder="Values (comma separated)"
          value={values}
          onChange={(e) => setValues(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        {editId ? (
          <button
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Update Attribute
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Attribute
          </button>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2">Existing Attributes</h3>
      <ul className="space-y-2">
        {attributes.map((attr) => (
          <li key={attr._id} className="border p-2 rounded flex justify-between">
            <div>
              <strong>{attr.name}:</strong> {attr.values.join(", ")}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => startEditing(attr)}
                className="text-yellow-600 font-semibold hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(attr._id)}
                className="text-red-600 font-semibold hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
