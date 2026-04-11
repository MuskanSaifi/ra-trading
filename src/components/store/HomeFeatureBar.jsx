import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  CreditCard,
  Package,
} from "lucide-react";

const items = [
  { icon: Truck, title: "Fast dispatch", desc: "Made for smooth restocking flows" },
  { icon: ShieldCheck, title: "Secure payments", desc: "Razorpay & encrypted checkout" },
  { icon: Headphones, title: "Support team", desc: "Helpful assistance when you need it" },
  { icon: RotateCcw, title: "Easy returns", desc: "Hassle-free policy" },
  { icon: CreditCard, title: "Flexible pay", desc: "COD & online options" },
  { icon: Package, title: "Careful packaging", desc: "Quick, reliable dispatch" },
];

export default function HomeFeatureBar() {
  return (
    <section className="store-feature-dark border-y border-white/10 text-gray-200">
      <div className="store-container relative z-[1] py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="store-glass-feature-card flex gap-3 items-start p-4"
            >
              <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--store-primary)]/20 text-[var(--store-primary)]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
