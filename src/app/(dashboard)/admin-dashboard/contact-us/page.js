"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/clientApiError";

export default function ContactUsAdminPage() {
  const [form, setForm] = useState({
    companyName: "",
    title: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    socialLinks: [],
    logo: { url: "", public_id: "" },
    favicon: { url: "", public_id: "" },
  });

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Fetch existing data
  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/admin/contact-us");
      const data = await res.json();

      if (data.success && data.data) {
        setForm(data.data);

        // ✅ Existing images preview from DB
        if (data.data.logo?.url) setLogoPreview(data.data.logo.url);
        if (data.data.favicon?.url) setFaviconPreview(data.data.favicon.url);
      }
    }
    loadData();
  }, []);

  // ✅ Basic inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Social Links
  const addSocialLink = () => {
    setForm({
      ...form,
      socialLinks: [
        ...form.socialLinks,
        {
          platform: "",
          url: "",
          icon: { url: "", public_id: "" },
        },
      ],
    });
  };

  const removeSocialLink = (index) => {
    const updated = [...form.socialLinks];
    updated.splice(index, 1);
    setForm({ ...form, socialLinks: updated });
  };

  const handleSocialChange = (index, field, value) => {
    const updated = [...form.socialLinks];
    updated[index][field] = value;
    setForm({ ...form, socialLinks: updated });
  };

  const handleSocialIconChange = (index, file) => {
    const updated = [...form.socialLinks];
    updated[index].iconFile = file;
    updated[index].iconPreview = URL.createObjectURL(file);
    setForm({ ...form, socialLinks: updated });
  };

  // ✅ Logo preview
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ✅ Favicon preview
  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));

      if (logoFile) formData.append("logo", logoFile);
      if (faviconFile) formData.append("favicon", faviconFile);

      form.socialLinks.forEach((social, index) => {
        if (social.iconFile) {
          formData.append(`socialIcon_${index}`, social.iconFile);
        }
      });

      const res = await fetch("/api/admin/contact-us/update", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(
          res,
          "Failed to update contact section."
        );
        setMessage(`❌ ${message}`);
        return;
      }

      const result = await res.json();

      setMessage(
        result.success
          ? "✅ Updated Successfully"
          : `❌ ${result.error || "Failed"}`
      );
    } catch (err) {
      setMessage("❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-6">🛠 Contact Section Admin</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BASIC INFO */}
        <div className="grid md:grid-cols-2 gap-4">
  {/* ✅ COMPANY NAME */}
  <input
    name="companyName"
    value={form.companyName}
    onChange={handleChange}
    placeholder="Company Name"
    className="p-2 border rounded"
  />

  {["title", "phone", "email", "address"].map((field) => (
    <input
      key={field}
      name={field}
      value={form[field]}
      onChange={handleChange}
      placeholder={field}
      className="p-2 border rounded"
    />
  ))}
</div>


        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
        />
        

        {/* ✅ LOGO + PREVIEW */}
        <div>
          <label className="font-semibold">Logo</label>
          <input type="file" onChange={handleLogoChange} />
          {logoPreview && (
            <img
              src={logoPreview}
              className="mt-2 w-24 h-24 object-contain border rounded"
            />
          )}
        </div>

        {/* ✅ FAVICON + PREVIEW */}
        <div>
          <label className="font-semibold">Favicon</label>
          <input type="file" onChange={handleFaviconChange} />
          {faviconPreview && (
            <img
              src={faviconPreview}
              className="mt-2 w-12 h-12 object-contain border rounded"
            />
          )}
        </div>

        {/* SOCIAL LINKS */}
        <div>
          <h2 className="text-lg font-semibold mb-3">🌐 Social Links</h2>

          {form.socialLinks.map((social, index) => (
            <div key={index} className="grid gap-3 mb-4 border p-3 rounded">
              <input
                placeholder="Platform"
                value={social.platform}
                onChange={(e) =>
                  handleSocialChange(index, "platform", e.target.value)
                }
                className="p-2 border rounded"
              />

              <input
                placeholder="URL"
                value={social.url}
                onChange={(e) =>
                  handleSocialChange(index, "url", e.target.value)
                }
                className="p-2 border rounded"
              />

              <input
                type="file"
                onChange={(e) =>
                  handleSocialIconChange(index, e.target.files[0])
                }
              />

              {(social.iconPreview || social.icon?.url) && (
                <img
                  src={social.iconPreview || social.icon?.url}
                  className="w-12 h-12 object-contain"
                />
              )}

              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="bg-red-500 text-white rounded px-3 py-1"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSocialLink}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add Social Link
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded"
        >
          {loading ? "Saving..." : "💾 Save Changes"}
        </button>

        {message && <p className="text-center">{message}</p>}
      </form>
    </div>
  );
}
