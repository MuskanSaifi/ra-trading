"use client";

import Link from "next/link";

/**
 * Electro-style page header band. Use a different `accent` per section for distinct pages.
 */
export default function PageBanner({
  title,
  subtitle,
  crumbs = [],
  accent = "default",
}) {
  const accents = {
    default: "from-[var(--store-primary)] to-amber-400",
    shop: "from-orange-500 to-[var(--store-primary)]",
    cart: "from-neutral-800 to-neutral-600",
    blog: "from-[var(--store-primary)] to-orange-600",
    about: "from-amber-600 to-[var(--store-primary)]",
    contact: "from-neutral-700 to-orange-500",
  };
  const grad = accents[accent] || accents.default;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r ${grad} text-white`}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
      <div className="store-container relative py-10 md:py-12">
        {crumbs.length > 0 && (
          <nav className="text-xs md:text-sm text-white/85 mb-3 flex flex-wrap gap-2 items-center">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/50">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
