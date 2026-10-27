"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    shiprocketPickupLocation: "",
    shiprocketPickupPincode: "",
    shiprocketChannelId: "",
    shiprocketBillingEmail: "",
    shiprocketDefaultLength: 20,
    shiprocketDefaultBreadth: 15,
    shiprocketDefaultHeight: 10,
    shiprocketDefaultWeight: 0.5,
    shiprocketDefaultHsn: 3305,
    shiprocketEnabled: true,
    payuEnabled: true,
    codEnabled: true,
  });

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(prev).map((k) => [
              k,
              data.settings?.[k] !== undefined ? data.settings[k] : prev[k],
            ])
          ),
        }));
      } else {
        setMsg(data.message || "Failed to load");
      }
    } catch {
      setMsg("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg(data.message || "Save failed");
        return;
      }
      setMsg("Settings saved");
      await load();
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const testConnections = async () => {
    setTesting(true);
    await load();
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading integrations...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-600">
            Manage PayU + Shiprocket from admin. API keys stay in{" "}
            <code className="rounded bg-slate-100 px-1">.env</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={testConnections}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
          Test connections
        </button>
      </div>

      {msg && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          {msg}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            {status?.payu?.configured ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h2 className="font-semibold">PayU</h2>
          </div>
          <p className="text-sm text-slate-600">
            Keys:{" "}
            {status?.payu?.configured
              ? `Configured (${status.payu.keyIdPreview || "****"}) · ${status.payu.env}`
              : "Missing PAYU_KEY / PAYU_SALT in .env"}
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.payuEnabled !== false}
              onChange={(e) =>
                setForm((f) => ({ ...f, payuEnabled: e.target.checked }))
              }
            />
            Enable PayU online payment at checkout
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.codEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, codEnabled: e.target.checked }))
              }
            />
            Enable COD (when product allows)
          </label>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            {status?.shiprocket?.connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h2 className="font-semibold">Shiprocket</h2>
          </div>
          <p className="text-sm text-slate-600">
            API user: {status?.shiprocket?.emailPreview || "Not set in .env"}
          </p>
          <p className="text-sm text-slate-600">
            Login:{" "}
            {status?.shiprocket?.connected
              ? "Connected"
              : status?.shiprocket?.error || "Not connected"}
          </p>
          {status?.shiprocket?.connected && status?.shiprocket?.error && (
            <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{status.shiprocket.error}</p>
          )}
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.shiprocketEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, shiprocketEnabled: e.target.checked }))
              }
            />
            Enable Shiprocket shipping actions
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Webhook URL:{" "}
            <code className="rounded bg-slate-100 px-1">
              /api/webhooks/shiprocket
            </code>
          </p>
        </div>
      </div>

      <form
        onSubmit={save}
        className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Shiprocket warehouse defaults</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Pickup location (from Shiprocket)
            {status?.shiprocket?.pickupLocations?.length ? (
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.shiprocketPickupLocation || ""}
                onChange={(e) => {
                  const picked = status.shiprocket.pickupLocations.find((p) => p.name === e.target.value);
                  setForm((f) => ({
                    ...f,
                    shiprocketPickupLocation: e.target.value,
                    shiprocketPickupPincode: picked?.pincode || f.shiprocketPickupPincode,
                  }));
                }}
              >
                <option value="">Use .env value ({status.shiprocket.activePickup || "not set"})</option>
                {status.shiprocket.pickupLocations.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                    {p.primary ? " (primary)" : ""} — {p.address}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.shiprocketPickupLocation || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shiprocketPickupLocation: e.target.value,
                  }))
                }
                placeholder="Exact nickname from Shiprocket, e.g. shop"
              />
            )}
          </label>
          <label className="text-sm">
            Pickup pincode
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketPickupPincode || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketPickupPincode: e.target.value,
                }))
              }
              placeholder="110001"
            />
          </label>
          <label className="text-sm">
            Channel ID (optional)
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketChannelId || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, shiprocketChannelId: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Billing email fallback
            <input
              type="email"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketBillingEmail || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketBillingEmail: e.target.value,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Default weight (kg)
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketDefaultWeight}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketDefaultWeight: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            Default HSN
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketDefaultHsn}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketDefaultHsn: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            L (cm)
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketDefaultLength}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketDefaultLength: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            B (cm)
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketDefaultBreadth}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketDefaultBreadth: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            H (cm)
            <input
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.shiprocketDefaultHeight}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shiprocketDefaultHeight: Number(e.target.value),
                }))
              }
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#6f1d1b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save integration settings"}
        </button>
      </form>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Credentials (.env only)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            PayU: <code>PAYU_KEY</code>, <code>PAYU_SALT</code>,{" "}
            <code>PAYU_ENV</code>
          </li>
          <li>
            Shiprocket API user: <code>SHIPROCKET_EMAIL</code>,{" "}
            <code>SHIPROCKET_PASSWORD</code>
          </li>
        </ul>
        <p className="mt-2">
          Orders page / order detail se ship, AWB, track, aur refund manage
          karo.
        </p>
      </div>
    </div>
  );
}
