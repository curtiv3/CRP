import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out with your first episodes",
    cta: "Get started free",
    href: "/register",
    featured: false,
    features: [
      "2 episodes per month",
      "Twitter + LinkedIn content",
      "Basic transcription",
      "Copy to clipboard",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators who publish weekly",
    cta: "Start Pro",
    href: "/register",
    featured: true,
    features: [
      "Unlimited episodes",
      "All 6 platforms",
      "Style profile learning",
      "Inline editing",
      "Download + export",
      "Priority processing",
    ],
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" id="pricing">
      <h2 className="text-center text-2xl font-semibold text-text-primary mb-3">
        Simple pricing
      </h2>
      <p className="text-center text-sm text-text-secondary mb-10">
        Start free. Upgrade when you&apos;re hooked.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.featured
                ? "border-brand bg-bg-surface shadow-md"
                : "border-border bg-bg-surface"
            }`}
          >
            {plan.featured && (
              <span className="inline-block rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand mb-4">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-text-primary">
              {plan.name}
            </h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-text-primary">
                {plan.price}
              </span>
              <span className="text-sm text-text-secondary">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {plan.description}
            </p>
            <Link
              href={plan.href}
              className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                plan.featured
                  ? "bg-brand text-text-inverse hover:bg-brand-hover"
                  : "bg-bg-elevated text-text-primary hover:bg-border"
              }`}
            >
              {plan.cta}
            </Link>
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
