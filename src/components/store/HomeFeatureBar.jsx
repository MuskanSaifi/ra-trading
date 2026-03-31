import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  CreditCard,
  Package,
} from "lucide-react";

const items = [
  { icon: Truck, title: "Free shipping", desc: "On eligible orders" },
  { icon: RotateCcw, title: "Easy returns", desc: "Hassle-free policy" },
  { icon: ShieldCheck, title: "Secure payment", desc: "Encrypted checkout" },
  { icon: Headphones, title: "24/7 support", desc: "We are here to help" },
  { icon: CreditCard, title: "Flexible pay", desc: "Multiple options" },
  { icon: Package, title: "Fast dispatch", desc: "Quick packaging" },
];

export default function HomeFeatureBar() {
  return (
    <section className="border-y border-[var(--store-border)] bg-white">
      <div className="store-container py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-3 items-start rounded-[var(--store-radius)] border border-[var(--store-border)] bg-[var(--store-surface)] p-4"
            >
              <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--store-ink)] uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-xs text-[var(--store-muted)] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
