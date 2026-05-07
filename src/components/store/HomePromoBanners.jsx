import Link from "next/link";

const promos = [
  {
    title: "Featured picks",
    desc: "Curated quality — limited-time value.",
    href: "/shop?sort=lowToHigh",
    image: "/images/promo1.png", // 👈 yahan apni image daal
  },
  {
    title: "Trending now",
    desc: "What shoppers are adding to cart.",
    href: "/shop?sort=highToLow",
    image: "/images/promo2.png", // 👈 yahan apni image daal
  },
];

export default function HomePromoBanners() {
  return (
    <section className="bg-[var(--store-surface)] py-10 md:py-14">
      <div className="store-container">
        <div className="grid md:grid-cols-2 gap-5 md:gap-8">
          {promos.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group relative overflow-hidden rounded-2xl h-[220px] md:h-[260px] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url(${p.image})` }}
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />

              {/* Content */}
              <div className="relative z-10 p-6 md:p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  Special
                </p>

                <h3 className="mt-2 text-2xl md:text-3xl font-extrabold">
                  {p.title}
                </h3>

                <p className="mt-2 text-sm text-white/90 max-w-sm">
                  {p.desc}
                </p>

                <span className="mt-6 inline-flex items-center text-sm font-bold border-b-2 border-white pb-0.5 group-hover:opacity-90">
                  Shop now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}