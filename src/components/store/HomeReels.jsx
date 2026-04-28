"use client";

import { useEffect, useState } from "react";

function isTruthyHtml(s) {
  const v = String(s || "").trim();
  return !!v && v !== "<p></p>";
}

export default function HomeReels() {
  const [reels, setReels] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/store/reels", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.reels) ? data.reels : [];
        setReels(list);
      } catch {
        setReels([]);
      }
    })();
  }, []);

  if (!reels) return null;
  if (reels.length === 0) return null;

  return (
    <section className="py-14 bg-white">
      <div className="store-container">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--store-ink)]">
              Video Reels
            </h2>
            <p className="text-sm text-[var(--store-muted)] mt-1">
              Quick highlights from our latest updates.
            </p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {reels.map((r) => (
            <div
              key={r._id || r.video?.url}
              className="snap-start shrink-0 w-[260px] sm:w-[300px] md:w-[340px]"
            >
              <div className="rounded-2xl border border-[var(--store-border)] bg-black overflow-hidden shadow-sm">
                <video
                  src={r.video?.url}
                  poster={r.poster?.url || undefined}
                  className="w-full aspect-[9/16] object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
              {(r.title || "").trim() && (
                <p className="mt-3 text-sm font-semibold text-[var(--store-ink)] line-clamp-2">
                  {r.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

