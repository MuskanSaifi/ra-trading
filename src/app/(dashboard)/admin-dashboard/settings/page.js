"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [zoneForm, setZoneForm] = useState({
    country: "India",
    state: "",
    city: "",
    pincodes: "",
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [security, setSecurity] = useState({
    password: "",
    twoFA: false,
  });

  const [site, setSite] = useState({
    siteName: "",
    currency: "INR",
    maintenance: false,
  });

  // Load saved settings (from backend)
  useEffect(() => {
    async function loadData() {
      try {
        const [res, zonesRes] = await Promise.all([
          fetch("/api/admin/setting"),
          fetch("/api/admin/delivery-zones"),
        ]);
        const data = await res.json();
        const zonesData = await zonesRes.json();

        if (data.success) {
          setProfile({
            name: data.settings.siteAdminName,
            email: data.settings.siteAdminEmail,
          });

          setSecurity({
            password: "",
            twoFA: data.settings.twoFA,
          });

          setSite({
            siteName: data.settings.siteName,
            currency: data.settings.currency,
            maintenance: data.settings.maintenance,
          });
        }

        if (zonesData?.success) {
          setZones(zonesData.zones || []);
        }
      } catch (err) {
        console.log("Settings Load Error:", err);
      }
      setLoading(false);
      setZonesLoading(false);
    }

    loadData();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurity({
      ...security,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSiteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSite({
      ...site,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/setting/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          security,
          site,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMsg({ type: "error", text: data.message || "Failed to save settings" });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Something went wrong" });
    }

    setSaving(false);
  };

  const refreshZones = async () => {
    setZonesLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-zones");
      const data = await res.json();
      if (data.success) setZones(data.zones || []);
    } finally {
      setZonesLoading(false);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!zoneForm.city?.trim()) {
      setMsg({ type: "error", text: "City is required." });
      return;
    }
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zoneForm),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ type: "error", text: data.message || "Failed to add delivery zone" });
        return;
      }
      setZoneForm((p) => ({ ...p, city: "", pincodes: "" }));
      await refreshZones();
      setMsg({ type: "success", text: "Delivery locations updated!" });
    } catch {
      setMsg({ type: "error", text: "Failed to update delivery locations" });
    }
  };

  const handleDeleteZone = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setZones((prev) => prev.filter((z) => z._id !== id));
      }
    } catch {
      // ignore
    }
  };

  // 🔥 Logout Function
  const handleLogout = async () => {
    await fetch("/api/admin/setting/logout", { method: "GET" });

    // Remove token from localStorage
    localStorage.removeItem("adminToken");

    // Redirect to login
    window.location.href = "/admin-login";
  };

  if (loading) {
    return (
      <p className="text-gray-600 flex items-center gap-2">
        <Loader2 className="animate-spin" /> Loading Settings...
      </p>
    );
  }

  return (
    <div className="text-gray-900">
      <h2 className="text-3xl font-bold mb-8">⚙️ Settings</h2>

      {/* STATUS MESSAGE */}
      {msg && (
        <div
          className={`p-3 rounded-md mb-4 flex items-center gap-2 ${
            msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 /> : <XCircle />}
          {msg.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 max-w-3xl bg-white p-6 shadow rounded-lg"
      >
        {/* Profile Settings */}
        <section>
          <h3 className="text-xl font-semibold mb-4">👤 Profile Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section>
          <h3 className="text-xl font-semibold mb-4">🔒 Security</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Change Password</label>
            <input
              type="password"
              name="password"
              value={security.password}
              onChange={handleSecurityChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter new password"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFA"
              name="twoFA"
              checked={security.twoFA}
              onChange={handleSecurityChange}
              className="mr-2"
            />
            <label htmlFor="twoFA">Enable Two-Factor Authentication (2FA)</label>
          </div>
        </section>

        {/* Site Settings */}
        <section>
          <h3 className="text-xl font-semibold mb-4">🌐 Site Settings</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              name="siteName"
              value={site.siteName}
              onChange={handleSiteChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              name="currency"
              value={site.currency}
              onChange={handleSiteChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenance"
              name="maintenance"
              checked={site.maintenance}
              onChange={handleSiteChange}
              className="mr-2"
            />
            <label htmlFor="maintenance">Enable Maintenance Mode</label>
          </div>
        </section>

        {/* Delivery Settings */}
        <section>
          <h3 className="text-xl font-semibold mb-4">🚚 Delivery Settings</h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={zoneForm.country}
                  onChange={(e) => setZoneForm({ ...zoneForm, country: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="India"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State (optional)</label>
                <input
                  type="text"
                  value={zoneForm.state}
                  onChange={(e) => setZoneForm({ ...zoneForm, state: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={zoneForm.city}
                  onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode(s)</label>
                <input
                  type="text"
                  value={zoneForm.pincodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, pincodes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Optional (blank = all pincodes in this city)"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddZone}
              className="bg-[var(--store-primary)] text-white px-5 py-2 rounded-md font-semibold hover:bg-[var(--store-primary-dark)]"
            >
              Add / Update delivery locations
            </button>
          </div>

          <div className="mt-5">
            {zonesLoading ? (
              <p className="text-sm text-gray-600">Loading delivery locations…</p>
            ) : zones.length === 0 ? (
              <p className="text-sm text-gray-600">
                No delivery pincodes added yet. Add your first serviceable location above.
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left">
                        <th className="p-3">Country</th>
                        <th className="p-3">State</th>
                        <th className="p-3">City</th>
                        <th className="p-3">Pincode</th>
                        <th className="p-3 w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zones.map((z) => (
                        <tr key={z._id} className="border-t">
                          <td className="p-3">{z.country}</td>
                          <td className="p-3">{z.state || "-"}</td>
                          <td className="p-3">{z.city}</td>
                          <td className="p-3 font-mono">{z.pincode}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteZone(z._id)}
                              className="text-red-600 hover:text-red-700 font-semibold"
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
            )}
          </div>
        </section>

        {/* Save Settings */}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          Save Changes
        </button>

        {/* 🔥 LOGOUT BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </form>
    </div>
  );
}
