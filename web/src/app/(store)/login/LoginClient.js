"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Truck, BadgePercent, Loader2, Phone } from "lucide-react";
import { safeRedirectPath } from "@/lib/logoutClient";

const RESEND_SECONDS = 30;

export default function LoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const redirect = safeRedirectPath(params.get("redirect"), "/");
  const fromCheckout = redirect.startsWith("/checkout");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    try {
      if (JSON.parse(localStorage.getItem("user") || "null")?._id) router.replace(redirect);
    } catch {}
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const showMsg = (text, t = "error") => {
    setMsg(text);
    setType(t);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) return showMsg("Enter a valid 10-digit mobile number");

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtp(["", "", "", "", "", ""]);
        setResendIn(RESEND_SECONDS);
        showMsg(`OTP sent to +91 ${phone}`, "success");
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else if (res.status === 429) {
        const waitMin = data.retryAfter ? Math.max(1, Math.ceil(Number(data.retryAfter) / 60)) : null;
        showMsg(
          waitMin
            ? `Too many requests. Try again in about ${waitMin} min.`
            : data.error || "Too many requests. Try again later."
        );
      } else {
        showMsg(data.message || data.error || "Could not send OTP");
      }
    } catch {
      showMsg("Could not reach the server. Check your connection.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (fullOtp) => {
    if (fullOtp.length !== 6 || loading) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: fullOtp }),
      });
      const data = await res.json();

      if (res.status === 429) {
        const waitMin = data.retryAfter ? Math.max(1, Math.ceil(Number(data.retryAfter) / 60)) : null;
        showMsg(
          waitMin
            ? `Too many attempts. Try again in about ${waitMin} min.`
            : data.error || "Too many attempts. Try again later."
        );
      } else if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("userAuthChanged"));
        showMsg("Signed in. Taking you back…", "success");
        router.replace(redirect);
        return;
      } else {
        showMsg(data.message || "Incorrect OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      showMsg("Could not reach the server. Check your connection.");
    }
    setLoading(false);
  };

  const setDigits = (digits, startIdx = 0) => {
    const next = [...otp];
    digits.split("").forEach((d, i) => {
      if (startIdx + i < 6) next[startIdx + i] = d;
    });
    setOtp(next);
    const filled = Math.min(startIdx + digits.length, 5);
    inputRefs.current[filled]?.focus();
    if (next.join("").length === 6) handleVerifyOtp(next.join(""));
  };

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[idx] = "";
      setOtp(next);
      return;
    }
    setDigits(digits.slice(-6), digits.length > 1 ? 0 : idx);
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    setDigits(digits, 0);
  };

  return (
    <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[var(--store-surface)] px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-[var(--store-border)] md:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-[var(--store-ink)] to-[var(--store-primary)] p-10 text-white md:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">RA Trading</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Wholesale shampoo & conditioner, delivered across India
            </h2>
          </div>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <BadgePercent className="h-5 w-5 shrink-0" /> Best wholesale prices on every order
            </li>
            <li className="flex items-center gap-3">
              <Truck className="h-5 w-5 shrink-0" /> Track every shipment from your account
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0" /> Secure payments with PayU or cash on delivery
            </li>
          </ul>
        </aside>

        <div className="p-6 sm:p-10">
          {fromCheckout && (
            <p className="mb-6 rounded-xl bg-[var(--store-primary-soft)] px-4 py-3 text-sm font-medium text-[var(--store-primary)]">
              Sign in to continue to checkout. Your cart is saved.
            </p>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <h1 className="text-2xl font-bold text-[var(--store-ink)]">Sign in or create account</h1>
              <p className="mt-1 text-sm text-gray-500">We'll send a one-time password to your mobile.</p>

              <label htmlFor="phone" className="mt-8 block text-sm font-semibold text-gray-700">
                Mobile number
              </label>
              <div className="mt-2 flex items-center rounded-xl border border-gray-300 bg-white focus-within:border-[var(--store-primary)] focus-within:ring-2 focus-within:ring-[var(--store-primary)]/20">
                <span className="flex items-center gap-1 border-r border-gray-200 px-3 py-3 text-sm font-semibold text-gray-600">
                  <Phone className="h-4 w-4" /> +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-r-xl px-3 py-3 text-base tracking-wide outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] py-3.5 font-semibold text-white transition hover:bg-[var(--store-primary-dark)] disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending OTP…" : "Get OTP"}
              </button>
            </form>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setMsg("");
                }}
                className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" /> Change number
              </button>
              <h1 className="text-2xl font-bold text-[var(--store-ink)]">Enter verification code</h1>
              <p className="mt-1 text-sm text-gray-500">
                Sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
              </p>

              <div className="mt-8 flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    aria-label={`Digit ${i + 1}`}
                    className="h-14 w-full max-w-[3.25rem] rounded-xl border border-gray-300 text-center text-xl font-bold outline-none focus:border-[var(--store-primary)] focus:ring-2 focus:ring-[var(--store-primary)]/20"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp(otp.join(""))}
                disabled={loading || otp.join("").length !== 6}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--store-primary)] py-3.5 font-semibold text-white transition hover:bg-[var(--store-primary-dark)] disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Verifying…" : fromCheckout ? "Verify & continue to checkout" : "Verify & sign in"}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                Didn't get the code?{" "}
                {resendIn > 0 ? (
                  <span>Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="font-semibold text-[var(--store-primary)] hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </div>
          )}

          {msg && (
            <p
              role="status"
              className={`mt-5 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {msg}
            </p>
          )}

          <p className="mt-8 text-center text-xs leading-5 text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms-and-conditions" className="underline">Terms</Link> and{" "}
            <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
