import Link from "next/link";

const promos = [
  {
    title: "Featured picks",
    desc: "Curated quality — limited-time value.",
    href: "/shop?sort=lowToHigh",
    tone: "from-amber-500 to-[var(--store-primary)]",
  },
  {
    title: "Trending now",
    desc: "What shoppers are adding to cart.",
    href: "/shop?sort=highToLow",
    tone: "from-neutral-800 to-neutral-600",
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
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.tone} p-8 md:p-10 text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Special
              </p>
              <h3 className="mt-2 text-2xl md:text-3xl font-extrabold">{p.title}</h3>
              <p className="mt-2 text-sm text-white/90 max-w-sm">{p.desc}</p>
              <span className="mt-6 inline-flex items-center text-sm font-bold border-b-2 border-white pb-0.5 group-hover:opacity-90">
                Shop now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
