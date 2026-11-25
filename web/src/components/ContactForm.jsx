"use client";

import { useState } from "react";
import { Mail, Phone, Send, User, BadgeHelp, ShieldCheck, Star } from "lucide-react";

const trustIconMap = {
  shield: ShieldCheck,
  star: Star,
  support: BadgeHelp,
  mail: Mail,
  phone: Phone,
};

export default function ContactForm({ sectionData }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Basic validation
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";

    if (form.phone.trim()) {
      if (!/^\d{10}$/.test(form.phone))
        newErrors.phone = "Phone must be 10 digits";
    }

    if (!form.message.trim()) newErrors.message = "Message is required";
    else if (form.message.length < 10)
      newErrors.message = "Message must be at least 10 characters long";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Frontend spam check (localStorage-based)
  const checkLocalMessageLimit = (phone) => {
    const key = `messages_${phone}`;
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem(key) || "{}");

    // reset if old day
    if (data.date !== today) {
      localStorage.setItem(
        key,
        JSON.stringify({ date: today, count: 0 })
      );
      return false;
    }

    // block if >= 2
    if (data.count >= 2) {
      setStatus("⚠️ You can only send 2 messages per day from this phone.");
      return true;
    }

    return false;
  };

  const incrementLocalMessageCount = (phone) => {
    const key = `messages_${phone}`;
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem(key) || "{}");

    const newData = {
      date: today,
      count: data.date === today ? (data.count || 0) + 1 : 1,
    };

    localStorage.setItem(key, JSON.stringify(newData));
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // frontend limit check
    if (form.phone && checkLocalMessageLimit(form.phone)) return;

    setLoading(true);
    setStatus("Submitting…");

    try {
      const res = await fetch("/api/store/contact-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (json.success) {
        incrementLocalMessageCount(form.phone);
        setStatus("✅ Message sent successfully!");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        setErrors({});
      } else {
        setStatus(`❌ ${json.error || "Failed to send message"}`);
      }
    } catch (error) {
      setStatus("❌ Server Error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value.trimStart() }));
  };

  const inputBaseClass =
    "w-full rounded-xl border border-[#e5d9d9] bg-white px-11 py-3 text-sm text-[#3f2a2a] placeholder:text-[#b8a9a9] outline-none transition focus:border-[#6f1d1b] focus:ring-2 focus:ring-[#6f1d1b]/20";

  const trustBadges =
    (sectionData?.trustBadges || []).length > 0
      ? sectionData.trustBadges
      : [
          { title: "100% Secure", subtitle: "Your data is safe", iconName: "shield" },
          { title: "Trusted", subtitle: "Happy customers", iconName: "star" },
          { title: "Quality Support", subtitle: "We're here to help", iconName: "support" },
        ];

  return (
    <div className="relative z-20 rounded-[28px] border border-[#e5d9d9] bg-[#fdfbfb] p-6 shadow-[0_26px_60px_rgba(23,10,10,0.18)] md:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6f1d1b] text-white shadow-md">
          <Mail size={20} />
        </div>
        <h3 className="text-3xl font-semibold text-[#2f1c1c]">
          {sectionData?.formTitle?.trim() || "Send Us a Message"}
        </h3>
        <div className="mx-auto mt-3 h-[2px] w-16 rounded-full bg-[#6f1d1b]" />
        {sectionData?.formSubtitle?.trim() ? (
          <p className="mt-2 text-sm text-[#7a6666]">{sectionData.formSubtitle.trim()}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#5f4b4b]">
            Full Name
          </label>
          <div className="relative">
            <User
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a9a9]"
            />
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={`${inputBaseClass} ${
                errors.name ? "border-red-500 focus:ring-red-200" : ""
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5f4b4b]">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a9a9]"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Your email address"
                className={`${inputBaseClass} ${
                  errors.email ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5f4b4b]">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a9a9]"
              />
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  const onlyDigits = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  setForm((prev) => ({ ...prev, phone: onlyDigits }));
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const paste = (
                    e.clipboardData || window.clipboardData
                  ).getData("text");
                  const onlyDigits = (paste || "").replace(/\D/g, "").slice(0, 10);
                  setForm((prev) => ({ ...prev, phone: onlyDigits }));
                }}
                placeholder="Your phone number"
                className={`${inputBaseClass} ${
                  errors.phone ? "border-red-500 focus:ring-red-200" : ""
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#5f4b4b]">
            Subject
          </label>
          <div className="relative">
            <BadgeHelp
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a9a9]"
            />
            <input
              name="subject"
              type="text"
              value={form.subject || ""}
              onChange={handleChange}
              placeholder="How can we help you?"
              className={inputBaseClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#5f4b4b]">
            Message
          </label>
          <div className="relative">
            <BadgeHelp
              size={16}
              className="pointer-events-none absolute left-4 top-4 text-[#b8a9a9]"
            />
            <textarea
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
              placeholder="Type your message here..."
              className={`${inputBaseClass} min-h-[120px] resize-y py-3 pl-11 ${
                errors.message ? "border-red-500 focus:ring-red-200" : ""
              }`}
            ></textarea>
          </div>
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">{errors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-xl bg-[#6f1d1b] py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(111,29,27,0.35)] transition hover:bg-[#5b1817] ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Send size={16} />
            {loading ? "Sending..." : "Send Message"}
          </span>
          {loading && (
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
        </button>
      </form>

      {trustBadges.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-2 text-xs text-[#776363] sm:grid-cols-3">
          {trustBadges.map((badge, index) => {
            const Icon = trustIconMap[badge?.iconName] || ShieldCheck;
            return (
              <div
                key={`${badge?.title || "badge"}-${index}`}
                className="flex items-start gap-2 rounded-lg bg-[#f3eded] p-2.5"
              >
                <Icon size={14} className="mt-0.5 shrink-0 text-[#6f1d1b]" />
                <div>
                  <p>{badge?.title || "Trust"}</p>
                  {badge?.subtitle ? (
                    <p className="text-[11px] text-[#8a7676]">{badge.subtitle}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {status && (
        <p className="mt-3 text-center text-sm font-medium text-[#4a3131]">
          {status}
        </p>
      )}
    </div>
  );
}
