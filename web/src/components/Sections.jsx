"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Sections = ({ section }) => {
  const [data, setData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const router = useRouter();

  const fetchBanner = async () => {
    try {
      const res = await fetch("/api/store/sections");
      const json = await res.json();
      const selected = json?.banners?.find((item) => item.section === section);
      setData(selected);
    } catch (error) {
      console.log("Banner API Error:", error);
    }
  };

  useEffect(() => {
    if (section) fetchBanner();
  }, [section]);

  const title = data?.title || "Deals you can trust — shop smarter";
  const subtitle =
    data?.subtitle ||
    "Quality products, secure checkout, and quick dispatch. Browse categories or jump straight into the catalog.";
  const imgUrl = data?.bannerUrl?.url;
  const addons = data?.addons || {};

  useEffect(() => {
    if (!addons?.countdownEnabled || !addons?.countdownEndsAt) {
      setTimeLeft(null);
      return;
    }

    const endsAt = new Date(addons.countdownEndsAt).getTime();
    if (!Number.isFinite(endsAt)) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, endsAt - now);
      setTimeLeft(diff);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [addons?.countdownEnabled, addons?.countdownEndsAt]);

  return (
    <section className="relative w-full max-w-full min-w-0 overflow-hidden bg-[var(--store-surface)]">
      {imgUrl ? (
        <div className="relative w-full min-h-[420px] md:min-h-[560px] overflow-hidden">
          <img
            src={imgUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(var(--store-primary-rgb),0.18),transparent_58%)]" />

          <div className="relative z-10 h-full px-5 sm:px-8 md:px-14 lg:px-20 py-12 md:py-16 flex items-center">
            <div className="w-full max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--store-primary)] mb-3">
                Welcome
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--store-ink)] leading-tight mb-5">
                {title}
              </h1>
              <p className="text-[var(--store-muted)] text-base md:text-lg mb-8">
                {subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/shop")}
                  className="bg-[var(--store-primary)] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[var(--store-primary-dark)] transition-colors"
                >
                  {data?.buttonText1 || "Shop now"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/about")}
                  className="bg-white/70 backdrop-blur border-2 border-[var(--store-ink)] text-[var(--store-ink)] px-8 py-3.5 rounded-full font-bold hover:bg-[var(--store-ink)] hover:text-white transition-colors"
                >
                  {data?.buttonText2 || "Learn more"}
                </button>
              </div>
            </div>
          </div>

          {addons?.offerEnabled && (
            <div className="absolute left-5 sm:left-8 md:left-14 lg:left-20 bottom-6 md:bottom-10 z-10">
              <div className="w-[min(320px,calc(100vw-2.5rem))] rounded-2xl border border-[var(--store-border)] bg-white/85 backdrop-blur shadow-xl p-4">
                {addons.offerBadgeText ? (
                  <p className="text-[10px] font-black tracking-widest text-[var(--store-primary)] uppercase">
                    {addons.offerBadgeText}
                  </p>
                ) : null}
                {addons.offerTitle ? (
                  <p className="mt-1 font-black text-[var(--store-ink)]">
                    {addons.offerTitle}
                  </p>
                ) : null}
                {addons.offerDiscountText ? (
                  <p className="mt-1 text-sm text-[var(--store-muted)]">
                    {addons.offerDiscountText}
                  </p>
                ) : null}

                {addons?.countdownEnabled && timeLeft != null ? (
                  <div className="mt-3 pt-3 border-t border-[var(--store-border)]">
                    <p className="text-[11px] font-bold text-[var(--store-muted)] uppercase tracking-wider">
                      {addons.countdownLabel || "Offer ends in"}
                    </p>
                    <p className="mt-1 font-black text-xl text-[var(--store-ink)] tabular-nums">
                      {String(Math.floor(timeLeft / 3600000)).padStart(2, "0")}:
                      {String(Math.floor((timeLeft % 3600000) / 60000)).padStart(2, "0")}:
                      {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-10 md:py-14">
          <div className="relative w-full max-w-full min-w-0 overflow-hidden bg-gradient-to-br from-[var(--store-surface)] via-white to-[var(--store-primary-soft)] rounded-3xl border border-[var(--store-border)]">
            <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_70%_30%,var(--store-primary),transparent_45%)] pointer-events-none" />
            <div className="relative py-14 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-w-0 px-6 md:px-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--store-primary)] mb-3">
                  Welcome
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--store-ink)] leading-tight mb-5">
                  {title}
                </h1>
                <p className="text-[var(--store-muted)] text-base md:text-lg mb-8 max-w-xl">{subtitle}</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/shop")}
                    className="bg-[var(--store-primary)] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[var(--store-primary-dark)] transition-colors"
                  >
                    {data?.buttonText1 || "Shop now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/about")}
                    className="border-2 border-[var(--store-ink)] text-[var(--store-ink)] px-8 py-3.5 rounded-full font-bold hover:bg-[var(--store-ink)] hover:text-white transition-colors"
                  >
                    {data?.buttonText2 || "Learn more"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--store-primary)]/30 to-[var(--store-primary-soft)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] text-sm font-semibold"
                  >
                    Image {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Sections;
