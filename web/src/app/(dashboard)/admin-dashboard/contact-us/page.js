"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/clientApiError";

const ICON_OPTIONS = [
  { value: "zap", label: "Zap" },
  { value: "briefcase", label: "Briefcase" },
  { value: "package", label: "Package" },
  { value: "shield", label: "Shield" },
  { value: "clock", label: "Clock" },
  { value: "mail", label: "Mail" },
  { value: "phone", label: "Phone" },
  { value: "star", label: "Star" },
  { value: "support", label: "Support" },
];

const CONTACT_TYPES = ["phone", "email", "address"];

const defaultForm = {
  companyName: "",
  title: "",
  subtitle: "",
  description: "",
  badgeText: "",
  phone: "",
  email: "",
  address: "",
  socialLinks: [],
  featureHighlights: [],
  contactItems: [],
  trustBadges: [],
  logo: { url: "", public_id: "" },
  favicon: { url: "", public_id: "" },
  showcaseImage: { url: "", public_id: "" },
};

export default function ContactUsAdminPage() {
  const [form, setForm] = useState(defaultForm);

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [showcaseImageFile, setShowcaseImageFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [showcasePreview, setShowcasePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Fetch existing data
  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/admin/contact-us");
      const data = await res.json();

      if (data.success && data.data) {
        setForm({ ...defaultForm, ...data.data });

        // ✅ Existing images preview from DB
        if (data.data.logo?.url) setLogoPreview(data.data.logo.url);
        if (data.data.favicon?.url) setFaviconPreview(data.data.favicon.url);
        if (data.data.showcaseImage?.url) setShowcasePreview(data.data.showcaseImage.url);
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

  const handleShowcaseChange = (e) => {
    const file = e.target.files[0];
    setShowcaseImageFile(file);
    setShowcasePreview(URL.createObjectURL(file));
  };

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      featureHighlights: [
        ...(prev.featureHighlights || []),
        { title: "", description: "", iconName: "zap" },
      ],
    }));
  };

  const updateFeature = (index, key, value) => {
    setForm((prev) => {
      const featureHighlights = [...(prev.featureHighlights || [])];
      featureHighlights[index] = { ...featureHighlights[index], [key]: value };
      return { ...prev, featureHighlights };
    });
  };

  const removeFeature = (index) => {
    setForm((prev) => ({
      ...prev,
      featureHighlights: (prev.featureHighlights || []).filter((_, i) => i !== index),
    }));
  };

  const addContactItem = () => {
    setForm((prev) => ({
      ...prev,
      contactItems: [
        ...(prev.contactItems || []),
        { type: "phone", value: "", note: "" },
      ],
    }));
  };

  const updateContactItem = (index, key, value) => {
    setForm((prev) => {
      const contactItems = [...(prev.contactItems || [])];
      contactItems[index] = { ...contactItems[index], [key]: value };
      return { ...prev, contactItems };
    });
  };

  const removeContactItem = (index) => {
    setForm((prev) => ({
      ...prev,
      contactItems: (prev.contactItems || []).filter((_, i) => i !== index),
    }));
  };

  const addTrustBadge = () => {
    setForm((prev) => ({
      ...prev,
      trustBadges: [
        ...(prev.trustBadges || []),
        { title: "", subtitle: "", iconName: "shield" },
      ],
    }));
  };

  const updateTrustBadge = (index, key, value) => {
    setForm((prev) => {
      const trustBadges = [...(prev.trustBadges || [])];
      trustBadges[index] = { ...trustBadges[index], [key]: value };
      return { ...prev, trustBadges };
    });
  };

  const removeTrustBadge = (index) => {
    setForm((prev) => ({
      ...prev,
      trustBadges: (prev.trustBadges || []).filter((_, i) => i !== index),
    }));
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
      if (showcaseImageFile) formData.append("showcaseImage", showcaseImageFile);

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
        <div className="grid md:grid-cols-2 gap-4">
          {["companyName", "title", "badgeText", "phone", "email", "address"].map((field) => (
            <input
              key={field}
              name={field}
              value={form[field] || ""}
              onChange={handleChange}
              placeholder={field}
              className="p-2 border rounded"
            />
          ))}
        </div>

        <textarea
          name="subtitle"
          value={form.subtitle || ""}
          onChange={handleChange}
          placeholder="Subtitle"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
        />

        <div className="grid md:grid-cols-3 gap-4">
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
          <div>
            <label className="font-semibold">Showcase Image (left bottom)</label>
            <input type="file" onChange={handleShowcaseChange} />
            {showcasePreview && (
              <img
                src={showcasePreview}
                className="mt-2 w-28 h-28 object-cover border rounded"
              />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">✨ Feature Highlights</h2>
          {(form.featureHighlights || []).map((feature, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 mb-4 border p-3 rounded">
              <input
                value={feature.title || ""}
                onChange={(e) => updateFeature(index, "title", e.target.value)}
                placeholder="Title"
                className="p-2 border rounded"
              />
              <input
                value={feature.description || ""}
                onChange={(e) => updateFeature(index, "description", e.target.value)}
                placeholder="Description"
                className="p-2 border rounded md:col-span-2"
              />
              <div className="flex gap-2">
                <select
                  value={feature.iconName || "zap"}
                  onChange={(e) => updateFeature(index, "iconName", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="bg-red-500 text-white rounded px-3"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add Feature
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">📌 Contact Items</h2>
          {(form.contactItems || []).map((item, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 mb-4 border p-3 rounded">
              <select
                value={item.type || "phone"}
                onChange={(e) => updateContactItem(index, "type", e.target.value)}
                className="p-2 border rounded"
              >
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                value={item.value || ""}
                onChange={(e) => updateContactItem(index, "value", e.target.value)}
                placeholder="Value"
                className="p-2 border rounded"
              />
              <input
                value={item.note || ""}
                onChange={(e) => updateContactItem(index, "note", e.target.value)}
                placeholder="Note"
                className="p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removeContactItem(index)}
                className="bg-red-500 text-white rounded px-3 py-1"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addContactItem}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add Contact Item
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">🛡 Trust Badges</h2>
          {(form.trustBadges || []).map((badge, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-3 mb-4 border p-3 rounded">
              <input
                value={badge.title || ""}
                onChange={(e) => updateTrustBadge(index, "title", e.target.value)}
                placeholder="Title"
                className="p-2 border rounded"
              />
              <input
                value={badge.subtitle || ""}
                onChange={(e) => updateTrustBadge(index, "subtitle", e.target.value)}
                placeholder="Subtitle"
                className="p-2 border rounded md:col-span-2"
              />
              <div className="flex gap-2">
                <select
                  value={badge.iconName || "shield"}
                  onChange={(e) => updateTrustBadge(index, "iconName", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeTrustBadge(index)}
                  className="bg-red-500 text-white rounded px-3"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addTrustBadge}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add Trust Badge
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">🌐 Social Links</h2>

          {(form.socialLinks || []).map((social, index) => (
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
