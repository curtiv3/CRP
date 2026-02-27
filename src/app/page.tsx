import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OutputPreview } from "@/components/landing/output-preview";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "ContentRepurpose — Turn Episodes into a Week of Content",
  description:
    "Upload your podcast or video episode. Get ready-to-publish posts for Twitter, LinkedIn, Instagram, and your newsletter — in your voice. Repurpose podcast content automatically.",
  openGraph: {
    title: "ContentRepurpose — Turn Episodes into a Week of Content",
    description:
      "Upload your podcast or video. Get platform-ready posts for Twitter, LinkedIn, Instagram, newsletters, and blog — in your voice.",
    type: "website",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="text-lg font-semibold text-text-primary">
            ContentRepurpose
          </span>
          <nav className="flex items-center gap-4">
            <Link
              href="#pricing"
              className="hidden sm:inline text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <OutputPreview />
        <Pricing />
        <FAQ />
      </main>

      <Footer />

      {/* SECURITY: dangerouslySetInnerHTML is safe here because the content is
          hardcoded static JSON-LD. Never interpolate user-supplied data into this block. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ContentRepurpose",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Upload your podcast or video episode. Get ready-to-publish posts for Twitter, LinkedIn, Instagram, and your newsletter — in your voice.",
            offers: [
              {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                name: "Free",
              },
              {
                "@type": "Offer",
                price: "19",
                priceCurrency: "USD",
                name: "Pro",
                billingIncrement: "P1M",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
