"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function Card({ item, className = "" }) {
  const content = (
    <div className={`group relative overflow-hidden rounded-2xl border border-[var(--store-border)] bg-white shadow-sm hover:shadow-lg transition ${className}`}>
      {item?.image?.url ? (
        <img
          src={item.image.url}
          alt={item?.title || ""}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      ) : (
        <div className="h-full w-full bg-[var(--store-surface)]" />
      )}
      {item?.title ? (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/55 to-transparent">
          <p className="text-sm font-bold text-white drop-shadow">{item.title}</p>
        </div>
      ) : null}
    </div>
  );

  if (item?.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export default function HomeGraphics() {
  const [blocks, setBlocks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/store/graphics", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setBlocks(Array.isArray(json?.blocks) ? json.blocks : []);
      } catch {
        if (alive) setBlocks([]);
      } finally {
        if (alive) setLoaded(true);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded || blocks.length === 0) return null;

  return (
    <section className="bg-[var(--store-surface)] py-10 md:py-14">
      <div className="space-y-10">
        {blocks.map((b) => {
          const items = Array.isArray(b.items) ? b.items : [];
          if (items.length === 0) return null;

          return (
            <div key={String(b._id)} className="space-y-4">
              {(b.title || b.subtitle) && (
                <div className="store-container">
                  {b.title ? (
                    <h2 className="text-xl md:text-2xl font-black text-[var(--store-ink)]">
                      {b.title}
                    </h2>
                  ) : null}
                  {b.subtitle ? (
                    <p className="mt-1 text-sm text-[var(--store-muted)]">
                      {b.subtitle}
                    </p>
                  ) : null}
                </div>
              )}

              {b.layout === "grid" ? (
                <div className="store-container">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {items.slice(0, 9).map((it, idx) => (
                      <Card key={idx} item={it} className="aspect-[16/10]" />
                    ))}
                  </div>
                </div>
              ) : b.layout === "carousel" ? (
                <div className="px-4 sm:px-6 md:px-10">
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {items.map((it, idx) => (
                      <div key={idx} className="min-w-[260px] sm:min-w-[320px] snap-start">
                        <Card item={it} className="aspect-[16/10]" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // strip (default)
                <div className="px-4 sm:px-6 md:px-10">
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {items.map((it, idx) => (
                      <div key={idx} className="min-w-[220px] sm:min-w-[280px] md:min-w-[320px] snap-start">
                        <Card item={it} className="aspect-[16/9]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

